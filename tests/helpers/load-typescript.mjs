import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { runInThisContext } from "node:vm";
import ts from "typescript";

const projectRoot = new URL("../../", import.meta.url);

// Exercise real TypeScript modules with explicitly supplied external dependencies.
export function loadModule(relativePath, dependencies = {}) {
    const source = readFileSync(new URL(relativePath, projectRoot), "utf8");
    const { outputText } = ts.transpileModule(source, {
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2020,
            esModuleInterop: true,
            jsx: ts.JsxEmit.ReactJSX,
        },
    });
    const exports = {};
    const factory = runInThisContext(`(function(exports, require, console) {\n${outputText}\n})`, {
        filename: fileURLToPath(new URL(relativePath, projectRoot)),
    });
    factory(exports, (specifier) => {
        if (!(specifier in dependencies)) {
            throw new Error(`Unexpected dependency: ${specifier}`);
        }
        return dependencies[specifier];
    }, { error() {} });
    return exports;
}
