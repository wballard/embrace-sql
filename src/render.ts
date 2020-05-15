import { RootContext } from "./context";
import walk from "ignore-walk";
import path from "path";
import readFile from "read-file-utf8";
import frontMatter from "front-matter";
import handlebars from "handlebars";

/**
 * Map iteration.
 */
handlebars.registerHelper("eachInMap", function (map, block) {
  let out = "";
  Object.keys(map).map(function (prop) {
    out += block.fn({ key: prop, value: map[prop] });
  });
  return out;
});

/**
 * Content to be written to a file.
 */
export type ToFile = {
  /**
   * Fully qualified path, write the file here.
   */
  fileName: string;
  /**
   * Fill in the file with this content.
   */
  content: string;
};

/**
 * Inspired almost exactly by hygen, but in process, and with handlebars as it is
 * more popular.
 *
 * Works on a directory of templates, which are handlebars with front matter.
 *
 * Front matter values are themselves handlebars templates.
 *
 * The only required front matter value is `to`, which turns into the target file
 * location. Other named values are added to the context before being passed to render
 * the body.
 *
 * @param rootContext - render off a root context, not a runtime context, as no API is being called
 * @param templatesInDirectory - read every template in this directory, honoring .ignore files
 *
 * @returns - a promise of the named files -- but this function doesn't do the writing
 */
export const renderTemplates = async (
  rootContext: RootContext,
  templatesInDirectory: string
): Promise<Array<ToFile>> => {
  return (
    walk({ path: templatesInDirectory })
      .then((fileNames) =>
        fileNames.map((fileName) => path.join(templatesInDirectory, fileName))
      )
      .then(async (templatePaths) => templatePaths.map(readFile))
      // the files themselves know their 'to' so we don't need to keep the file name
      // but might as well flatten out those promises
      .then((_) => Promise.all(_))
      // this is the 'rendering loop'
      .then((templates) =>
        templates.map((template) => {
          // pick out the front matter, this leaves us with variables and template
          const { attributes, body } = frontMatter(template);
          // render the front matter variables
          const frontMatterVariables = Object.entries(attributes).reduce(
            (obj, [key, value]) => {
              return {
                ...obj,
                [key]: handlebars.compile(value)(rootContext),
              };
            },
            {}
          );
          // render the actual template with the context extended
          // by the front matter variables
          return {
            fileName: frontMatterVariables["to"],
            content: handlebars.compile(body)(
              Object.assign({}, rootContext, frontMatterVariables)
            ),
          };
        })
      )
  );
};
