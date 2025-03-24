 >>> HTML & static sites
GitHub logo
Edit on GitHub

Bun's bundler has first-class support for HTML. Build static sites, landing pages, and web applications with zero configuration. Just point Bun at your HTML file and it handles everything else.

index.html
<!doctype html>
<html>
  <head>
    <link rel="stylesheet" href="./styles.css" />
    <script src="./app.ts" type="module"></script>
  </head>
  <body>
    <img src="./logo.png" />
  </body>
</html>
To get started, pass HTML files to bun.

bun ./index.html
Bun
v1.2.5
ready in
6.62
ms
→
http://localhost:3000/
Press
h
+
Enter
to show shortcuts
Bun's development server provides powerful features with zero configuration:

Automatic Bundling - Bundles and serves your HTML, JavaScript, and CSS
Multi-Entry Support - Handles multiple HTML entry points and glob entry points
Modern JavaScript - TypeScript & JSX support out of the box
Smart Configuration - Reads tsconfig.json for paths, JSX options, experimental decorators, and more
Plugins - Plugins for TailwindCSS and more
ESM & CommonJS - Use ESM and CommonJS in your JavaScript, TypeScript, and JSX files
CSS Bundling & Minification - Bundles CSS from <link> tags and @import statements
Asset Management
Automatic copying & hashing of images and assets
Rewrites asset paths in JavaScript, CSS, and HTML
Single Page Apps (SPA)
When you pass a single .html file to Bun, Bun will use it as a fallback route for all paths. This makes it perfect for single page apps that use client-side routing:

bun index.html
Bun
v1.2.5
ready in
6.62
ms
→
http://localhost:3000/
Press
h
+
Enter
to show shortcuts
Your React or other SPA will work out of the box — no configuration needed. All routes like /about, /users/123, etc. will serve the same HTML file, letting your client-side router handle the navigation.

index.html
<!doctype html>
<html>
  <head>
    <title>My SPA</title>
    <script src="./app.tsx" type="module"></script>
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>
Multi-page apps (MPA)
Some projects have several separate routes or HTML files as entry points. To support multiple entry points, pass them all to bun

bun ./index.html ./about.html
Bun
v1.2.5
ready in
6.62
ms
→
http://localhost:3000/
Routes:
/
./index.html
/about
./about.html
Press
h
+
Enter
to show shortcuts
This will serve:

index.html at /
about.html at /about
Glob patterns
To specify multiple files, you can use glob patterns that end in .html:

bun ./**/*.html
Bun
v1.2.5
ready in
6.62
ms
→
http://localhost:3000/
Routes:
/
./index.html
/about
./about.html
Press
h
+
Enter
to show shortcuts
Path normalization
The base path is chosen from the longest common prefix among all the files.

bun ./index.html ./about/index.html ./about/foo/index.html
Bun
v1.2.5
ready in
6.62
ms
→
http://localhost:3000/
Routes:
/
./index.html
/about
./about/index.html
/about/foo
./about/foo/index.html
Press
h
+
Enter
to show shortcuts
JavaScript, TypeScript, and JSX
Bun's transpiler natively implements JavaScript, TypeScript, and JSX support. Learn more about loaders in Bun.

Bun's transpiler is also used at runtime.

ES Modules & CommonJS
You can use ESM and CJS in your JavaScript, TypeScript, and JSX files. Bun will handle the transpilation and bundling automatically.

There is no pre-build or separate optimization step. It's all done at the same time.

Learn more about module resolution in Bun.

CSS
Bun's CSS parser is also natively implemented (clocking in around 58,000 lines of Zig).

It's also a CSS bundler. You can use @import in your CSS files to import other CSS files.

For example:

styles.css
@import "./abc.css";

.container {
  background-color: blue;
}
abc.css
body {
  background-color: red;
}
This outputs:

styles.css
body {
  background-color: red;
}

.container {
  background-color: blue;
}
Referencing local assets in CSS
You can reference local assets in your CSS files.

styles.css
body {
  background-image: url("./logo.png");
}
This will copy ./logo.png to the output directory and rewrite the path in the CSS file to include a content hash.

styles.css
body {
  background-image: url("./logo-[ABC123].png");
}
Importing CSS in JavaScript
To associate a CSS file with a JavaScript file, you can import it in your JavaScript file.

app.ts
import "./styles.css";
import "./more-styles.css";
This generates ./app.css and ./app.js in the output directory. All CSS files imported from JavaScript will be bundled into a single CSS file per entry point. If you import the same CSS file from multiple JavaScript files, it will only be included once in the output CSS file.

Plugins
The dev server supports plugins.

Tailwind CSS
To use TailwindCSS, install the bun-plugin-tailwind plugin:

# Or any npm client
bun install --dev bun-plugin-tailwind
Then, add the plugin to your bunfig.toml:

[serve.static]
plugins = ["bun-plugin-tailwind"]
Then, reference TailwindCSS in your HTML via <link> tag, @import in CSS, or import in JavaScript.

index.html
styles.css
app.ts
<!-- Reference TailwindCSS in your HTML -->
<link rel="stylesheet" href="tailwindcss" />
Only one of those are necessary, not all three.

Keyboard Shortcuts
While the server is running:

o + Enter - Open in browser
c + Enter - Clear console
q + Enter (or Ctrl+C) - Quit server
Build for Production
When you're ready to deploy, use bun build to create optimized production bundles:

CLI
API
bun build ./index.html --minify --outdir=dist
Currently, plugins are only supported through Bun.build's API or through bunfig.toml with the frontend dev server - not yet supported in bun build's CLI.

Watch Mode
You can run bun build --watch to watch for changes and rebuild automatically. This works nicely for library development.

You've never seen a watch mode this fast.

Plugin API
Need more control? Configure the bundler through the JavaScript API and use Bun's builtin HTMLRewriter to preprocess HTML.

await Bun.build({
  entrypoints: ["./index.html"],
  outdir: "./dist",
  minify: true,

  plugins: [
    {
      // A plugin that makes every HTML tag lowercase
      name: "lowercase-html-plugin",
      setup({ onLoad }) {
        const rewriter = new HTMLRewriter().on("*", {
          element(element) {
            element.tagName = element.tagName.toLowerCase();
          },
          text(element) {
            element.replace(element.text.toLowerCase());
          },
        });

        onLoad({ filter: /\.html$/ }, async args => {
          const html = await Bun.file(args.path).text();

          return {
            // Bun's bundler will scan the HTML for <script> tags, <link rel="stylesheet"> tags, and other assets
            // and bundle them automatically
            contents: rewriter.transform(html),
            loader: "html",
          };
        });
      },
    },
  ],
});
What Gets Processed?
Bun automatically handles all common web assets:

Scripts (<script src>) are run through Bun's JavaScript/TypeScript/JSX bundler
Stylesheets (<link rel="stylesheet">) are run through Bun's CSS parser & bundler
Images (<img>, <picture>) are copied and hashed
Media (<video>, <audio>, <source>) are copied and hashed
Any <link> tag with an href attribute pointing to a local file is rewritten to the new path, and hashed
All paths are resolved relative to your HTML file, making it easy to organize your project however you want.

This is a work in progress
No HMR support yet
Need more plugins
Need more configuration options for things like asset handling
Need a way to configure CORS, headers, etc.
If you want to submit a PR, most of the code is here. You could even copy paste that file into your project and use it as a starting point. Fullstack Dev Server
GitHub logo
Edit on GitHub

Using Bun.serve()'s routes option, you can run your frontend and backend in the same app with no extra steps.

To get started, import HTML files and pass them to the routes option in Bun.serve().

import { sql, serve } from "bun";
import dashboard from "./dashboard.html";
import homepage from "./index.html";

const server = serve({
  routes: {
    // ** HTML imports **
    // Bundle & route index.html to "/". This uses HTMLRewriter to scan the HTML for `<script>` and `<link>` tags, run's Bun's JavaScript & CSS bundler on them, transpiles any TypeScript, JSX, and TSX, downlevels CSS with Bun's CSS parser and serves the result.
    "/": homepage,
    // Bundle & route dashboard.html to "/dashboard"
    "/dashboard": dashboard,

    // ** API endpoints ** (Bun v1.2.3+ required)
    "/api/users": {
      async GET(req) {
        const users = await sql`SELECT * FROM users`;
        return Response.json(users);
      },
      async POST(req) {
        const { name, email } = await req.json();
        const [user] =
          await sql`INSERT INTO users (name, email) VALUES (${name}, ${email})`;
        return Response.json(user);
      },
    },
    "/api/users/:id": async req => {
      const { id } = req.params;
      const [user] = await sql`SELECT * FROM users WHERE id = ${id}`;
      return Response.json(user);
    },
  },

  // Enable development mode for:
  // - Detailed error messages
  // - Hot reloading (Bun v1.2.3+ required)
  development: true,

  // Prior to v1.2.3, the `fetch` option was used to handle all API requests. It is now optional.
  // async fetch(req) {
  //   // Return 404 for unmatched routes
  //   return new Response("Not Found", { status: 404 });
  // },
});

console.log(`Listening on ${server.url}`);
bun run app.ts
HTML imports are routes
The web starts with HTML, and so does Bun's fullstack dev server.

To specify entrypoints to your frontend, import HTML files into your JavaScript/TypeScript/TSX/JSX files.

import dashboard from "./dashboard.html";
import homepage from "./index.html";
These HTML files are used as routes in Bun's dev server you can pass to Bun.serve().

Bun.serve({
  routes: {
    "/": homepage,
    "/dashboard": dashboard,
  }

  fetch(req) {
    // ... api requests
  },
});
When you make a request to /dashboard or /, Bun automatically bundles the <script> and <link> tags in the HTML files, exposes them as static routes, and serves the result.

An index.html file like this:

index.html
<!DOCTYPE html>
<html>
  <head>
    <title>Home</title>
    <link rel="stylesheet" href="./reset.css" />
    <link rel="stylesheet" href="./styles.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./sentry-and-preloads.ts"></script>
    <script type="module" src="./my-app.tsx"></script>
  </body>
</html>
Becomes something like this:

index.html
<!DOCTYPE html>
<html>
  <head>
    <title>Home</title>
    <link rel="stylesheet" href="/index-[hash].css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/index-[hash].js"></script>
  </body>
</html>
How to use with React
To use React in your client-side code, import react-dom/client and render your app.

src/backend.ts
src/frontend.tsx
public/dashboard.html
src/styles.css
src/app.tsx
import dashboard from "../public/dashboard.html";
import { serve } from "bun";

serve({
  routes: {
    "/": dashboard,
  },

  async fetch(req) {
    // ...api requests
    return new Response("hello world");
  },
});
Development mode
When building locally, enable development mode by setting development: true in Bun.serve().

import homepage from "./index.html";
import dashboard from "./dashboard.html";

Bun.serve({
  routes: {
    "/": homepage,
    "/dashboard": dashboard,
  }

  development: true,

  fetch(req) {
    // ... api requests
  },
});
When development is true, Bun will:

Include the SourceMap header in the response so that devtools can show the original source code
Disable minification
Re-bundle assets on each request to a .html file
Production mode
When serving your app in production, set development: false in Bun.serve().

Enable in-memory caching of bundled assets. Bun will bundle assets lazily on the first request to an .html file, and cache the result in memory until the server restarts.
Enables Cache-Control headers and ETag headers
Minifies JavaScript/TypeScript/TSX/JSX files
Plugins
Bun's bundler plugins are also supported when bundling static routes.

To configure plugins for Bun.serve, add a plugins array in the [serve.static] section of your bunfig.toml.

Using TailwindCSS in HTML routes
For example, enable TailwindCSS on your routes by installing and adding the bun-plugin-tailwind plugin:

bun add bun-plugin-tailwind
bunfig.toml
[serve.static]
plugins = ["bun-plugin-tailwind"]
This will allow you to use TailwindCSS utility classes in your HTML and CSS files. All you need to do is import tailwindcss somewhere:

index.html
<!doctype html>
<html>
  <head>
    <title>Home</title>
    <link rel="stylesheet" href="tailwindcss" />
  </head>
  <body>
    <!-- the rest of your HTML... -->
  </body>
</html>
Or in your CSS:

style.css
@import "tailwindcss";
Custom plugins
Any JS file or module which exports a valid bundler plugin object (essentially an object with a name and setup field) can be placed inside the plugins array:

bunfig.toml
[serve.static]
plugins = ["./my-plugin-implementation.ts"]
Bun will lazily resolve and load each plugin and use them to bundle your routes.

Note: this is currently in bunfig.toml to make it possible to know statically which plugins are in use when we eventually integrate this with the bun build CLI. These plugins work in Bun.build()'s JS API, but are not yet supported in the CLI.

How this works
Bun uses HTMLRewriter to scan for <script> and <link> tags in HTML files, uses them as entrypoints for Bun's bundler, generates an optimized bundle for the JavaScript/TypeScript/TSX/JSX and CSS files, and serves the result.

<script> processing

Transpiles TypeScript, JSX, and TSX in <script> tags
Bundles imported dependencies
Generates sourcemaps for debugging
Minifies when development is not true in Bun.serve()
<script type="module" src="./counter.tsx"></script>
<link> processing

Processes CSS imports and <link> tags
Concatenates CSS files
Rewrites url and asset paths to include content-addressable hashes in URLs
<link rel="stylesheet" href="./styles.css" />
<img> & asset processing

Links to assets are rewritten to include content-addressable hashes in URLs
Small assets in CSS files are inlined into data: URLs, reducing the total number of HTTP requests sent over the wire
Rewrite HTML

Combines all <script> tags into a single <script> tag with a content-addressable hash in the URL
Combines all <link> tags into a single <link> tag with a content-addressable hash in the URL
Outputs a new HTML file
Serve

All the output files from the bundler are exposed as static routes, using the same mechanism internally as when you pass a Response object to static in Bun.serve().
This works similarly to how Bun.build processes HTML files. Hot reloading
GitHub logo
Edit on GitHub

Hot Module Replacement (HMR) allows you to update modules in a running application without needing a full page reload. This preserves the application state and improves the development experience.

HMR is enabled by default when using Bun's full-stack development server.

import.meta.hot API Reference
Bun implements a client-side HMR API modeled after Vite's import.meta.hot API. It can be checked for with if (import.meta.hot), tree-shaking it in production

if (import.meta.hot) {
  // HMR APIs are available.
}
However, this check is often not needed as Bun will dead-code-eliminate calls to all of the HMR APIs in production builds.

// This entire function call will be removed in production!
import.meta.hot.dispose(() => {
  console.log("dispose");
});
For this to work, Bun forces these APIs to be called without indirection. That means the following do not work:

invalid-hmr-usage.ts
// INVALID: Assigning `hot` to a variable
const hot = import.meta.hot;
hot.accept();

// INVALID: Assigning `import.meta` to a variable
const meta = import.meta;
meta.hot.accept();
console.log(meta.hot.data);

// INVALID: Passing to a function
doSomething(import.meta.hot.dispose);

// OK: The full phrase "import.meta.hot.<API>" must be called directly:
import.meta.hot.accept();

// OK: `data` can be passed to functions:
doSomething(import.meta.hot.data);
Note — The HMR API is still a work in progress. Some features are missing. HMR can be disabled in Bun.serve by setting the development option to { hmr: false }.

Method	Notes
✅	hot.accept()	Indicate that a hot update can be replaced gracefully.
✅	hot.data	Persist data between module evaluations.
✅	hot.dispose()	Add a callback function to run when a module is about to be replaced.
❌	hot.invalidate()	
✅	hot.on()	Attach an event listener
✅	hot.off()	Remove an event listener from on.
❌	hot.send()	
🚧	hot.prune()	NOTE: Callback is currently never called.
✅	hot.decline()	No-op to match Vite's import.meta.hot
import.meta.hot.accept()
The accept() method indicates that a module can be hot-replaced. When called without arguments, it indicates that this module can be replaced simply by re-evaluating the file. After a hot update, importers of this module will be automatically patched.

index.ts
import { getCount } from "./foo.ts";

console.log("count is ", getCount());

import.meta.hot.accept();

export function getNegativeCount() {
  return -getCount();
}
This creates a hot-reloading boundary for all of the files that index.ts imports. That means whenever foo.ts or any of its dependencies are saved, the update will bubble up to index.ts will re-evaluate. Files that import index.ts will then be patched to import the new version of getNegativeCount(). If only index.ts is updated, only the one file will be re-evaluated, and the counter in foo.ts is reused.

This may be used in combination with import.meta.hot.data to transfer state from the previous module to the new one.

When no modules call import.meta.hot.accept() (and there isn't React Fast Refresh or a plugin calling it for you), the page will reload when the file updates, and a console warning shows which files were invalidated. This warning is safe to ignore if it makes more sense to rely on full page reloads.

With callback
When provided one callback, import.meta.hot.accept will function how it does in Vite. Instead of patching the importers of this module, it will call the callback with the new module.

export const count = 0;

import.meta.hot.accept(newModule => {
  if (newModule) {
    // newModule is undefined when SyntaxError happened
    console.log("updated: count is now ", newModule.count);
  }
});
Prefer using import.meta.hot.accept() without an argument as it usually makes your code easier to understand.

Accepting other modules
import { count } from "./foo";

import.meta.hot.accept("./foo", () => {
  if (!newModule) return;

  console.log("updated: count is now ", count);
});
Indicates that a dependency's module can be accepted. When the dependency is updated, the callback will be called with the new module.

With multiple dependencies
import.meta.hot.accept(["./foo", "./bar"], newModules => {
  // newModules is an array where each item corresponds to the updated module
  // or undefined if that module had a syntax error
});
Indicates that multiple dependencies' modules can be accepted. This variant accepts an array of dependencies, where the callback will receive the updated modules, and undefined for any that had errors.

import.meta.hot.data
import.meta.hot.data maintains state between module instances during hot replacement, enabling data transfer from previous to new versions. When import.meta.hot.data is written into, Bun will also mark this module as capable of self-accepting (equivalent of calling import.meta.hot.accept()).

import { createRoot } from "react-dom/client";
import { App } from "./app";

const root = import.meta.hot.data.root ??= createRoot(elem);
root.render(<App />); // re-use an existing root
In production, data is inlined to be {}, meaning it cannot be used as a state holder.

The above pattern is recommended for stateful modules because Bun knows it can minify {}.prop ??= value into value in production.

import.meta.hot.dispose()
Attaches an on-dispose callback. This is called:

Just before the module is replaced with another copy (before the next is loaded)
After the module is detached (removing all imports to this module, see import.meta.hot.prune())
const sideEffect = setupSideEffect();

import.meta.hot.dispose(() => {
  sideEffect.cleanup();
});
This callback is not called on route navigation or when the browser tab closes.

Returning a promise will delay module replacement until the module is disposed. All dispose callbacks are called in parallel.

import.meta.hot.prune()
Attaches an on-prune callback. This is called when all imports to this module are removed, but the module was previously loaded.

This can be used to clean up resources that were created when the module was loaded. Unlike import.meta.hot.dispose(), this pairs much better with accept and data to manage stateful resources. A full example managing a WebSocket:

import { something } from "./something";

// Initialize or re-use a WebSocket connection
export const ws = (import.meta.hot.data.ws ??= new WebSocket(location.origin));

// If the module's import is removed, clean up the WebSocket connection.
import.meta.hot.prune(() => {
  ws.close();
});
If dispose was used instead, the WebSocket would close and re-open on every hot update. Both versions of the code will prevent page reloads when imported files are updated.

import.meta.hot.on() and off()
on() and off() are used to listen for events from the HMR runtime. Event names are prefixed with a prefix so that plugins do not conflict with each other.

import.meta.hot.on("bun:beforeUpdate", () => {
  console.log("before a hot update");
});
When a file is replaced, all of its event listeners are automatically removed.

A list of all built-in events:

Event	Emitted when
bun:beforeUpdate	before a hot update is applied.
bun:afterUpdate	after a hot update is applied.
bun:beforeFullReload	before a full page reload happens.
bun:beforePrune	before prune callbacks are called.
bun:invalidate	when a module is invalidated with import.meta.hot.invalidate()
bun:error	when a build or runtime error occurs
bun:ws:disconnect	when the HMR WebSocket connection is lost. This can indicate the development server is offline.
bun:ws:connect	when the HMR WebSocket connects or re-connects.
For compatibility with Vite, the above events are also available via vite:* prefix instead of bun:*. Bun.build
GitHub logo
Edit on GitHub

Bun's fast native bundler is now in beta. It can be used via the bun build CLI command or the Bun.build() JavaScript API.

JavaScript
CLI
await Bun.build({
  entrypoints: ['./index.tsx'],
  outdir: './build',
});
It's fast. The numbers below represent performance on esbuild's three.js benchmark.


Bundling 10 copies of three.js from scratch, with sourcemaps and minification
Why bundle?
The bundler is a key piece of infrastructure in the JavaScript ecosystem. As a brief overview of why bundling is so important:

Reducing HTTP requests. A single package in node_modules may consist of hundreds of files, and large applications may have dozens of such dependencies. Loading each of these files with a separate HTTP request becomes untenable very quickly, so bundlers are used to convert our application source code into a smaller number of self-contained "bundles" that can be loaded with a single request.
Code transforms. Modern apps are commonly built with languages or tools like TypeScript, JSX, and CSS modules, all of which must be converted into plain JavaScript and CSS before they can be consumed by a browser. The bundler is the natural place to configure these transformations.
Framework features. Frameworks rely on bundler plugins & code transformations to implement common patterns like file-system routing, client-server code co-location (think getServerSideProps or Remix loaders), and server components.
Let's jump into the bundler API.

Note that the Bun bundler is not intended to replace tsc for typechecking or generating type declarations.

Basic example
Let's build our first bundle. You have the following two files, which implement a simple client-side rendered React app.

./index.tsx
./Component.tsx
import * as ReactDOM from 'react-dom/client';
import {Component} from "./Component"

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<Component message="Sup!" />)
Here, index.tsx is the "entrypoint" to our application. Commonly, this will be a script that performs some side effect, like starting a server or—in this case—initializing a React root. Because we're using TypeScript & JSX, we need to bundle our code before it can be sent to the browser.

To create our bundle:

JavaScript
CLI
await Bun.build({
  entrypoints: ['./index.tsx'],
  outdir: './out',
})
For each file specified in entrypoints, Bun will generate a new bundle. This bundle will be written to disk in the ./out directory (as resolved from the current working directory). After running the build, the file system looks like this:

.
├── index.tsx
├── Component.tsx
└── out
    └── index.js
The contents of out/index.js will look something like this:

out/index.js
// ...
// ~20k lines of code
// including the contents of `react-dom/client` and all its dependencies
// this is where the $jsxDEV and $createRoot functions are defined


// Component.tsx
function Component(props) {
  return $jsxDEV("p", {
    children: props.message
  }, undefined, false, undefined, this);
}

// index.tsx
var rootNode = document.getElementById("root");
var root = $createRoot(rootNode);
root.render($jsxDEV(Component, {
  message: "Sup!"
}, undefined, false, undefined, this));

Watch mode
Like the runtime and test runner, the bundler supports watch mode natively.

bun build ./index.tsx --outdir ./out --watch
Content types
Like the Bun runtime, the bundler supports an array of file types out of the box. The following table breaks down the bundler's set of standard "loaders". Refer to Bundler > File types for full documentation.

Extensions	Details
.js .jsx, .cjs .mjs .mts .cts .ts .tsx	Uses Bun's built-in transpiler to parse the file and transpile TypeScript/JSX syntax to vanilla JavaScript. The bundler executes a set of default transforms including dead code elimination and tree shaking. At the moment Bun does not attempt to down-convert syntax; if you use recently ECMAScript syntax, that will be reflected in the bundled code.
.json

JSON files are parsed and inlined into the bundle as a JavaScript object.

import pkg from "./package.json";
pkg.name; // => "my-package"
.toml

TOML files are parsed and inlined into the bundle as a JavaScript object.

import config from "./bunfig.toml";
config.logLevel; // => "debug"
.txt

The contents of the text file are read and inlined into the bundle as a string.

import contents from "./file.txt";
console.log(contents); // => "Hello, world!"
.node .wasm	These files are supported by the Bun runtime, but during bundling they are treated as assets.
Assets
If the bundler encounters an import with an unrecognized extension, it treats the imported file as an external file. The referenced file is copied as-is into outdir, and the import is resolved as a path to the file.

Input
Output
// bundle entrypoint
import logo from "./logo.svg";
console.log(logo);
The exact behavior of the file loader is also impacted by naming and publicPath.

Refer to the Bundler > Loaders page for more complete documentation on the file loader.

Plugins
The behavior described in this table can be overridden or extended with plugins. Refer to the Bundler > Loaders page for complete documentation.

API
entrypoints
Required. An array of paths corresponding to the entrypoints of our application. One bundle will be generated for each entrypoint.

JavaScript
CLI
const result = await Bun.build({
  entrypoints: ["./index.ts"],
});
// => { success: boolean, outputs: BuildArtifact[], logs: BuildMessage[] }
outdir
The directory where output files will be written.

JavaScript
CLI
const result = await Bun.build({
  entrypoints: ['./index.ts'],
  outdir: './out'
});
// => { success: boolean, outputs: BuildArtifact[], logs: BuildMessage[] }
If outdir is not passed to the JavaScript API, bundled code will not be written to disk. Bundled files are returned in an array of BuildArtifact objects. These objects are Blobs with extra properties; see Outputs for complete documentation.

const result = await Bun.build({
  entrypoints: ["./index.ts"],
});

for (const res of result.outputs) {
  // Can be consumed as blobs
  await res.text();

  // Bun will set Content-Type and Etag headers
  new Response(res);

  // Can be written manually, but you should use `outdir` in this case.
  Bun.write(path.join("out", res.path), res);
}
When outdir is set, the path property on a BuildArtifact will be the absolute path to where it was written to.

target
The intended execution environment for the bundle.

JavaScript
CLI
await Bun.build({
  entrypoints: ['./index.ts'],
  outdir: './out',
  target: 'browser', // default
})
Depending on the target, Bun will apply different module resolution rules and optimizations.

browser	Default. For generating bundles that are intended for execution by a browser. Prioritizes the "browser" export condition when resolving imports. Importing any built-in modules, like node:events or node:path will work, but calling some functions, like fs.readFile will not work.
bun

For generating bundles that are intended to be run by the Bun runtime. In many cases, it isn't necessary to bundle server-side code; you can directly execute the source code without modification. However, bundling your server code can reduce startup times and improve running performance.

All bundles generated with target: "bun" are marked with a special // @bun pragma, which indicates to the Bun runtime that there's no need to re-transpile the file before execution.

If any entrypoints contains a Bun shebang (#!/usr/bin/env bun) the bundler will default to target: "bun" instead of "browser".

When using target: "bun" and format: "cjs" together, the // @bun @bun-cjs pragma is added and the CommonJS wrapper function is not compatible with Node.js.

node	For generating bundles that are intended to be run by Node.js. Prioritizes the "node" export condition when resolving imports, and outputs .mjs. In the future, this will automatically polyfill the Bun global and other built-in bun:* modules, though this is not yet implemented.
format
Specifies the module format to be used in the generated bundles.

Bun defaults to "esm", and provides experimental support for "cjs" and "iife".

format: "esm" - ES Module
This is the default format, which supports ES Module syntax including top-level await, import.meta, and more.

JavaScript
CLI
await Bun.build({
  entrypoints: ['./index.tsx'],
  outdir: './out',
  format: "esm",
})
To use ES Module syntax in browsers, set format to "esm" and make sure your <script type="module"> tag has type="module" set.

format: "cjs" - CommonJS
To build a CommonJS module, set format to "cjs". When choosing "cjs", the default target changes from "browser" (esm) to "node" (cjs). CommonJS modules transpiled with format: "cjs", target: "node" can be executed in both Bun and Node.js (assuming the APIs in use are supported by both).

JavaScript
CLI
await Bun.build({
  entrypoints: ['./index.tsx'],
  outdir: './out',
  format: "cjs",
})
format: "iife" - IIFE
TODO: document IIFE once we support globalNames.

splitting
Whether to enable code splitting.

JavaScript
CLI
await Bun.build({
  entrypoints: ['./index.tsx'],
  outdir: './out',
  splitting: false, // default
})
When true, the bundler will enable code splitting. When multiple entrypoints both import the same file, module, or set of files/modules, it's often useful to split the shared code into a separate bundle. This shared bundle is known as a chunk. Consider the following files:

entry-a.ts
entry-b.ts
shared.ts
import { shared } from './shared.ts';
To bundle entry-a.ts and entry-b.ts with code-splitting enabled:

JavaScript
CLI
await Bun.build({
  entrypoints: ['./entry-a.ts', './entry-b.ts'],
  outdir: './out',
  splitting: true,
})
Running this build will result in the following files:

.
├── entry-a.tsx
├── entry-b.tsx
├── shared.tsx
└── out
    ├── entry-a.js
    ├── entry-b.js
    └── chunk-2fce6291bf86559d.js

The generated chunk-2fce6291bf86559d.js file contains the shared code. To avoid collisions, the file name automatically includes a content hash by default. This can be customized with naming.

plugins
A list of plugins to use during bundling.

JavaScript
CLI
await Bun.build({
  entrypoints: ['./index.tsx'],
  outdir: './out',
  plugins: [/* ... */],
})
Bun implements a universal plugin system for both Bun's runtime and bundler. Refer to the plugin documentation for complete documentation.

env
Controls how environment variables are handled during bundling. Internally, this uses define to inject environment variables into the bundle, but makes it easier to specify the environment variables to inject.

env: "inline"
Injects environment variables into the bundled output by converting process.env.FOO references to string literals containing the actual environment variable values.

JavaScript
CLI
await Bun.build({
  entrypoints: ['./index.tsx'],
  outdir: './out',
  env: "inline",
})
For the input below:

input.js
console.log(process.env.FOO);
console.log(process.env.BAZ);
The generated bundle will contain the following code:

output.js
console.log("bar");
console.log("123");
env: "PUBLIC_*" (prefix)
Inlines environment variables matching the given prefix (the part before the * character), replacing process.env.FOO with the actual environment variable value. This is useful for selectively inlining environment variables for things like public-facing URLs or client-side tokens, without worrying about injecting private credentials into output bundles.

JavaScript
CLI
await Bun.build({
  entrypoints: ['./index.tsx'],
  outdir: './out',

  // Inline all env vars that start with "ACME_PUBLIC_"
  env: "ACME_PUBLIC_*",
})
For example, given the following environment variables:

FOO=bar BAZ=123 ACME_PUBLIC_URL=https://acme.com
And source code:

index.tsx
console.log(process.env.FOO);
console.log(process.env.ACME_PUBLIC_URL);
console.log(process.env.BAZ);
The generated bundle will contain the following code:

console.log(process.env.FOO);
console.log("https://acme.com");
console.log(process.env.BAZ);
env: "disable"
Disables environment variable injection entirely.

For example, given the following environment variables:

FOO=bar BAZ=123 ACME_PUBLIC_URL=https://acme.com
And source code:

index.tsx
console.log(process.env.FOO);
console.log(process.env.ACME_PUBLIC_URL);
console.log(process.env.BAZ);
The generated bundle will contain the following code:

console.log(process.env.FOO);
console.log(process.env.BAZ);
sourcemap
Specifies the type of sourcemap to generate.

JavaScript
CLI
await Bun.build({
  entrypoints: ['./index.tsx'],
  outdir: './out',
  sourcemap: 'linked', // default 'none'
})
"none"	Default. No sourcemap is generated.
"linked"

A separate *.js.map file is created alongside each *.js bundle using a //# sourceMappingURL comment to link the two. Requires --outdir to be set. The base URL of this can be customized with --public-path.

// <bundled code here>

//# sourceMappingURL=bundle.js.map
"external"	A separate *.js.map file is created alongside each *.js bundle without inserting a //# sourceMappingURL comment.
Generated bundles contain a debug id that can be used to associate a bundle with its corresponding sourcemap. This debugId is added as a comment at the bottom of the file.

// <generated bundle code>

//# debugId=<DEBUG ID>
"inline"

A sourcemap is generated and appended to the end of the generated bundle as a base64 payload.

// <bundled code here>

//# sourceMappingURL=data:application/json;base64,<encoded sourcemap here>
The associated *.js.map sourcemap will be a JSON file containing an equivalent debugId property.

minify
Whether to enable minification. Default false.

When targeting bun, identifiers will be minified by default.

To enable all minification options:

JavaScript
CLI
await Bun.build({
  entrypoints: ['./index.tsx'],
  outdir: './out',
  minify: true, // default false
})
To granularly enable certain minifications:

JavaScript
CLI
await Bun.build({
  entrypoints: ['./index.tsx'],
  outdir: './out',
  minify: {
    whitespace: true,
    identifiers: true,
    syntax: true,
  },
})
external
A list of import paths to consider external. Defaults to [].

JavaScript
CLI
await Bun.build({
  entrypoints: ['./index.tsx'],
  outdir: './out',
  external: ["lodash", "react"], // default: []
})
An external import is one that will not be included in the final bundle. Instead, the import statement will be left as-is, to be resolved at runtime.

For instance, consider the following entrypoint file:

index.tsx
import _ from "lodash";
import {z} from "zod";

const value = z.string().parse("Hello world!")
console.log(_.upperCase(value));
Normally, bundling index.tsx would generate a bundle containing the entire source code of the "zod" package. If instead, we want to leave the import statement as-is, we can mark it as external:

JavaScript
CLI
await Bun.build({
  entrypoints: ['./index.tsx'],
  outdir: './out',
  external: ['zod'],
})
The generated bundle will look something like this:

out/index.js
import {z} from "zod";

// ...
// the contents of the "lodash" package
// including the `_.upperCase` function

var value = z.string().parse("Hello world!")
console.log(_.upperCase(value));
To mark all imports as external, use the wildcard *:

JavaScript
CLI
await Bun.build({
  entrypoints: ['./index.tsx'],
  outdir: './out',
  external: ['*'],
})
packages
Control whatever package dependencies are included to bundle or not. Possible values: bundle (default), external. Bun treats any import which path do not start with ., .. or / as package.

JavaScript
CLI
await Bun.build({
  entrypoints: ['./index.ts'],
  packages: 'external',
})
naming
Customizes the generated file names. Defaults to ./[dir]/[name].[ext].

JavaScript
CLI
await Bun.build({
  entrypoints: ['./index.tsx'],
  outdir: './out',
  naming: "[dir]/[name].[ext]", // default
})
By default, the names of the generated bundles are based on the name of the associated entrypoint.

.
├── index.tsx
└── out
    └── index.js
With multiple entrypoints, the generated file hierarchy will reflect the directory structure of the entrypoints.

.
├── index.tsx
└── nested
    └── index.tsx
└── out
    ├── index.js
    └── nested
        └── index.js
The names and locations of the generated files can be customized with the naming field. This field accepts a template string that is used to generate the filenames for all bundles corresponding to entrypoints. where the following tokens are replaced with their corresponding values:

[name] - The name of the entrypoint file, without the extension.
[ext] - The extension of the generated bundle.
[hash] - A hash of the bundle contents.
[dir] - The relative path from the project root to the parent directory of the source file.
For example:

Token	[name]	[ext]	[hash]	[dir]
./index.tsx	index	js	a1b2c3d4	"" (empty string)
./nested/entry.ts	entry	js	c3d4e5f6	"nested"
We can combine these tokens to create a template string. For instance, to include the hash in the generated bundle names:

JavaScript
CLI
await Bun.build({
  entrypoints: ['./index.tsx'],
  outdir: './out',
  naming: 'files/[dir]/[name]-[hash].[ext]',
})
This build would result in the following file structure:

.
├── index.tsx
└── out
    └── files
        └── index-a1b2c3d4.js
When a string is provided for the naming field, it is used only for bundles that correspond to entrypoints. The names of chunks and copied assets are not affected. Using the JavaScript API, separate template strings can be specified for each type of generated file.

JavaScript
CLI
await Bun.build({
  entrypoints: ['./index.tsx'],
  outdir: './out',
  naming: {
    // default values
    entry: '[dir]/[name].[ext]',
    chunk: '[name]-[hash].[ext]',
    asset: '[name]-[hash].[ext]',
  },
})
root
The root directory of the project.

JavaScript
CLI
await Bun.build({
  entrypoints: ['./pages/a.tsx', './pages/b.tsx'],
  outdir: './out',
  root: '.',
})
If unspecified, it is computed to be the first common ancestor of all entrypoint files. Consider the following file structure:

.
└── pages
  └── index.tsx
  └── settings.tsx
We can build both entrypoints in the pages directory:

JavaScript
CLI
await Bun.build({
  entrypoints: ['./pages/index.tsx', './pages/settings.tsx'],
  outdir: './out',
})
This would result in a file structure like this:

.
└── pages
  └── index.tsx
  └── settings.tsx
└── out
  └── index.js
  └── settings.js
Since the pages directory is the first common ancestor of the entrypoint files, it is considered the project root. This means that the generated bundles live at the top level of the out directory; there is no out/pages directory.

This behavior can be overridden by specifying the root option:

JavaScript
CLI
await Bun.build({
  entrypoints: ['./pages/index.tsx', './pages/settings.tsx'],
  outdir: './out',
  root: '.',
})
By specifying . as root, the generated file structure will look like this:

.
└── pages
  └── index.tsx
  └── settings.tsx
└── out
  └── pages
    └── index.js
    └── settings.js
publicPath
A prefix to be appended to any import paths in bundled code.

In many cases, generated bundles will contain no import statements. After all, the goal of bundling is to combine all of the code into a single file. However there are a number of cases with the generated bundles will contain import statements.

Asset imports — When importing an unrecognized file type like *.svg, the bundler defers to the file loader, which copies the file into outdir as is. The import is converted into a variable
External modules — Files and modules can be marked as external, in which case they will not be included in the bundle. Instead, the import statement will be left in the final bundle.
Chunking. When splitting is enabled, the bundler may generate separate "chunk" files that represent code that is shared among multiple entrypoints.
In any of these cases, the final bundles may contain paths to other files. By default these imports are relative. Here is an example of a simple asset import:

Input
Output
import logo from './logo.svg';
console.log(logo);
Setting publicPath will prefix all file paths with the specified value.

JavaScript
CLI
await Bun.build({
  entrypoints: ['./index.tsx'],
  outdir: './out',
  publicPath: 'https://cdn.example.com/', // default is undefined
})
The output file would now look something like this.

Output
var logo = './logo-a7305bdef.svg';
var logo = 'https://cdn.example.com/logo-a7305bdef.svg';
define
A map of global identifiers to be replaced at build time. Keys of this object are identifier names, and values are JSON strings that will be inlined.

JavaScript
CLI
await Bun.build({
  entrypoints: ['./index.tsx'],
  outdir: './out',
  define: {
    STRING: JSON.stringify("value"),
    "nested.boolean": "true",
  },
})
loader
A map of file extensions to built-in loader names. This can be used to quickly customize how certain files are loaded.

JavaScript
CLI
await Bun.build({
  entrypoints: ['./index.tsx'],
  outdir: './out',
  loader: {
    ".png": "dataurl",
    ".txt": "file",
  },
})
banner
A banner to be added to the final bundle, this can be a directive like "use client" for react or a comment block such as a license for the code.

JavaScript
CLI
await Bun.build({
  entrypoints: ['./index.tsx'],
  outdir: './out',
  banner: '"use client";'
})
footer
A footer to be added to the final bundle, this can be something like a comment block for a license or just a fun easter egg.

JavaScript
CLI
await Bun.build({
  entrypoints: ['./index.tsx'],
  outdir: './out',
  footer: '// built with love in SF'
})
drop
Remove function calls from a bundle. For example, --drop=console will remove all calls to console.log. Arguments to calls will also be removed, regardless of if those arguments may have side effects. Dropping debugger will remove all debugger statements.

JavaScript
CLI
await Bun.build({
  entrypoints: ['./index.tsx'],
  outdir: './out',
  drop: ["console", "debugger", "anyIdentifier.or.propertyAccess"],
})
Outputs
The Bun.build function returns a Promise<BuildOutput>, defined as:

interface BuildOutput {
  outputs: BuildArtifact[];
  success: boolean;
  logs: Array<object>; // see docs for details
}

interface BuildArtifact extends Blob {
  kind: "entry-point" | "chunk" | "asset" | "sourcemap";
  path: string;
  loader: Loader;
  hash: string | null;
  sourcemap: BuildArtifact | null;
}
The outputs array contains all the files that were generated by the build. Each artifact implements the Blob interface.

const build = await Bun.build({
  /* */
});

for (const output of build.outputs) {
  await output.arrayBuffer(); // => ArrayBuffer
  await output.bytes(); // => Uint8Array
  await output.text(); // string
}
Each artifact also contains the following properties:

kind	What kind of build output this file is. A build generates bundled entrypoints, code-split "chunks", sourcemaps, bytecode, and copied assets (like images).
path	Absolute path to the file on disk
loader	The loader was used to interpret the file. See Bundler > Loaders to see how Bun maps file extensions to the appropriate built-in loader.
hash	The hash of the file contents. Always defined for assets.
sourcemap	The sourcemap file corresponding to this file, if generated. Only defined for entrypoints and chunks.
Similar to BunFile, BuildArtifact objects can be passed directly into new Response().

const build = await Bun.build({
  /* */
});

const artifact = build.outputs[0];

// Content-Type header is automatically set
return new Response(artifact);
The Bun runtime implements special pretty-printing of BuildArtifact object to make debugging easier.

Build script
Shell output
// build.ts
const build = await Bun.build({/* */});

const artifact = build.outputs[0];
console.log(artifact);
Bytecode
The bytecode: boolean option can be used to generate bytecode for any JavaScript/TypeScript entrypoints. This can greatly improve startup times for large applications. Only supported for "cjs" format, only supports "target": "bun" and dependent on a matching version of Bun. This adds a corresponding .jsc file for each entrypoint.

JavaScript
CLI
await Bun.build({
  entrypoints: ["./index.tsx"],
  outdir: "./out",
  bytecode: true,
})
Executables
Bun supports "compiling" a JavaScript/TypeScript entrypoint into a standalone executable. This executable contains a copy of the Bun binary.

bun build ./cli.tsx --outfile mycli --compile
./mycli
Refer to Bundler > Executables for complete documentation.

Logs and errors
On failure, Bun.build returns a rejected promise with an AggregateError. This can be logged to the console for pretty printing of the error list, or programmatically read with a try/catch block.

try {
  const result = await Bun.build({
    entrypoints: ["./index.tsx"],
    outdir: "./out",
  });
} catch (e) {
  // TypeScript does not allow annotations on the catch clause
  const error = e as AggregateError;
  console.error("Build Failed");

  // Example: Using the built-in formatter
  console.error(error);

  // Example: Serializing the failure as a JSON string.
  console.error(JSON.stringify(error, null, 2));
}
Most of the time, an explicit try/catch is not needed, as Bun will neatly print uncaught exceptions. It is enough to just use a top-level await on the Bun.build call.

Each item in error.errors is an instance of BuildMessage or ResolveMessage (subclasses of Error), containing detailed information for each error.

class BuildMessage {
  name: string;
  position?: Position;
  message: string;
  level: "error" | "warning" | "info" | "debug" | "verbose";
}

class ResolveMessage extends BuildMessage {
  code: string;
  referrer: string;
  specifier: string;
  importKind: ImportKind;
}
On build success, the returned object contains a logs property, which contains bundler warnings and info messages.

const result = await Bun.build({
  entrypoints: ["./index.tsx"],
  outdir: "./out",
});

if (result.logs.length > 0) {
  console.warn("Build succeeded with warnings:");
  for (const message of result.logs) {
    // Bun will pretty print the message object
    console.warn(message);
  }
}
Reference
interface Bun {
  build(options: BuildOptions): Promise<BuildOutput>;
}

interface BuildConfig {
  entrypoints: string[]; // list of file path
  outdir?: string; // output directory
  target?: Target; // default: "browser"
  /**
   * Output module format. Top-level await is only supported for `"esm"`.
   *
   * Can be:
   * - `"esm"`
   * - `"cjs"` (**experimental**)
   * - `"iife"` (**experimental**)
   *
   * @default "esm"
   */
  format?: "esm" | "cjs" | "iife";
  naming?:
    | string
    | {
        chunk?: string;
        entry?: string;
        asset?: string;
      };
  root?: string; // project root
  splitting?: boolean; // default true, enable code splitting
  plugins?: BunPlugin[];
  external?: string[];
  packages?: "bundle" | "external";
  publicPath?: string;
  define?: Record<string, string>;
  loader?: { [k in string]: Loader };
  sourcemap?: "none" | "linked" | "inline" | "external" | "linked" | boolean; // default: "none", true -> "inline"
  /**
   * package.json `exports` conditions used when resolving imports
   *
   * Equivalent to `--conditions` in `bun build` or `bun run`.
   *
   * https://nodejs.org/api/packages.html#exports
   */
  conditions?: Array<string> | string;

  /**
   * Controls how environment variables are handled during bundling.
   *
   * Can be one of:
   * - `"inline"`: Injects environment variables into the bundled output by converting `process.env.FOO`
   *   references to string literals containing the actual environment variable values
   * - `"disable"`: Disables environment variable injection entirely
   * - A string ending in `*`: Inlines environment variables that match the given prefix.
   *   For example, `"MY_PUBLIC_*"` will only include env vars starting with "MY_PUBLIC_"
   */
  env?: "inline" | "disable" | `${string}*`;
  minify?:
    | boolean
    | {
        whitespace?: boolean;
        syntax?: boolean;
        identifiers?: boolean;
      };
  /**
   * Ignore dead code elimination/tree-shaking annotations such as @__PURE__ and package.json
   * "sideEffects" fields. This should only be used as a temporary workaround for incorrect
   * annotations in libraries.
   */
  ignoreDCEAnnotations?: boolean;
  /**
   * Force emitting @__PURE__ annotations even if minify.whitespace is true.
   */
  emitDCEAnnotations?: boolean;

  /**
   * Generate bytecode for the output. This can dramatically improve cold
   * start times, but will make the final output larger and slightly increase
   * memory usage.
   *
   * Bytecode is currently only supported for CommonJS (`format: "cjs"`).
   *
   * Must be `target: "bun"`
   * @default false
   */
  bytecode?: boolean;
  /**
   * Add a banner to the bundled code such as "use client";
   */
  banner?: string;
  /**
   * Add a footer to the bundled code such as a comment block like
   *
   * `// made with bun!`
   */
  footer?: string;

  /**
   * Drop function calls to matching property accesses.
   */
  drop?: string[];

  /**
   * When set to `true`, the returned promise rejects with an AggregateError when a build failure happens.
   * When set to `false`, the `success` property of the returned object will be `false` when a build failure happens.
   *
   * This defaults to `false` in Bun 1.1 and will change to `true` in Bun 1.2
   * as most usage of `Bun.build` forgets to check for errors.
   */
  throw?: boolean;
}

interface BuildOutput {
  outputs: BuildArtifact[];
  success: boolean;
  logs: Array<BuildMessage | ResolveMessage>;
}

interface BuildArtifact extends Blob {
  path: string;
  loader: Loader;
  hash: string | null;
  kind: "entry-point" | "chunk" | "asset" | "sourcemap" | "bytecode";
  sourcemap: BuildArtifact | null;
}

type Loader =
  | "js"
  | "jsx"
  | "ts"
  | "tsx"
  | "json"
  | "toml"
  | "file"
  | "napi"
  | "wasm"
  | "text";

interface BuildOutput {
  outputs: BuildArtifact[];
  success: boolean;
  logs: Array<BuildMessage | ResolveMessage>;
}

declare class ResolveMessage {
  readonly name: "ResolveMessage";
  readonly position: Position | null;
  readonly code: string;
  readonly message: string;
  readonly referrer: string;
  readonly specifier: string;
  readonly importKind:
    | "entry_point"
    | "stmt"
    | "require"
    | "import"
    | "dynamic"
    | "require_resolve"
    | "at"
    | "at_conditional"
    | "url"
    | "internal";
  readonly level: "error" | "warning" | "info" | "debug" | "verbose";

  toString(): string;
}
CLI Usage
bun build <entrypoints...>
Flags
Output Configuration
--outdir=<val>
Default to "dist" if multiple files
--outfile=<val>
Write to a file
--sourcemap=<val>
Build with sourcemaps - 'linked', 'inline', 'external', or 'none'
--banner=<val>
Add a banner to the bundled output such as "use client"; for a bundle being used with RSCs
--footer=<val>
Add a footer to the bundled output such as // built with bun!
--format=<val>
Specifies the module format to build to. Only "esm" is supported.
--root=<val>
Root directory used for multiple entry points
--public-path=<val>
A prefix to be appended to any import paths in bundled code
Bundling Behavior
--compile
Generate a standalone Bun executable containing your bundled code
--bytecode
Use a bytecode cache
--watch
Automatically restart the process on file change
--no-clear-screen
Disable clearing the terminal screen on reload when --watch is enabled
--splitting
Enable code splitting
--no-bundle
Transpile file only, do not bundle
Target Environment
--target=<val>
The intended execution environment for the bundle. "browser", "bun" or "node"
--conditions=<val>
Pass custom conditions to resolve
External Dependencies
-e
,
--external=<val>
Exclude module from transpilation (can use * wildcards). ex: -e react
--packages=<val>
Add dependencies to bundle or keep them external. "external", "bundle" is supported. Defaults to "bundle".
File Naming
--entry-naming=<val>
Customize entry point filenames. Defaults to "[dir]/[name].[ext]"
--chunk-naming=<val>
Customize chunk filenames. Defaults to "[name]-[hash].[ext]"
--asset-naming=<val>
Customize asset filenames. Defaults to "[name]-[hash].[ext]"
Minification
--minify
Enable all minification flags
--minify-syntax
Minify syntax and inline data
--minify-whitespace
Minify whitespace
--minify-identifiers
Minify identifiers
--emit-dce-annotations
Re-emit DCE annotations in bundles. Enabled by default unless --minify-whitespace is passed.
CSS Handling
--css-chunking
Chunk CSS files together to reduce duplicated CSS loaded in a browser. Only has an effect when multiple entrypoints import CSS
Experimental Features
--react-fast-refresh
Enable React Fast Refresh transform (does not emit hot-module code, use this for testing)
--app
(EXPERIMENTAL) Build a web app for production using Bun Bake.
--server-components
(EXPERIMENTAL) Enable server components
Environment Variables
--env=<val>
Inline environment variables into the bundle as process.env.${name}. Defaults to 'disable'. To inline environment variables matching a prefix, use my prefix like 'FOO_PUBLIC_*'.
Windows-specific
--windows-hide-console
When using --compile targeting Windows, prevent a Command prompt from opening alongside the executable
--windows-icon=<val>
When using --compile targeting Windows, assign an executable icon
Examples
Frontend web apps:
bun build --outfile=bundle.js ./src/index.ts
bun build --minify --splitting --outdir=out ./index.jsx ./lib/worker.ts
Bundle code to be run in Bun (reduces server startup time)
bun build --target=bun --outfile=server.js ./server.ts
Creating a standalone executable (see https://bun.sh/docs/bundler/executables)
bun build --compile --outfile=my-app ./cli.ts
A full list of flags is available at https://bun.sh/docs/bundler