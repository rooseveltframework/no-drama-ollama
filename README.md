🦙 **no-drama-ollama** [![npm](https://img.shields.io/npm/v/no-drama-ollama.svg)](https://www.npmjs.com/package/no-drama-ollama)

Minimalist web client for [Ollama](https://ollama.com) which focuses on being easy to setup, run, and embed in your web application with a highly customizable appearance. Can also be used as a standalone app as well.

## Basic setup

- Install prerequisites:
  - Install [Ollama](https://ollama.com) to your system and ensure it is running.
  - Install [Node.js](http://nodejs.org). Both the current and LTS version of Node.js are supported. It is recommended to use a Node.js version manager like [nvm](https://github.com/creationix/nvm) or [nvm-windows](https://github.com/coreybutler/nvm-windows) rather than the official installer, as a version manager will allow you to switch between multiple versions of Node.js easily.

- Clone this repo.

- Install dependencies:
  - Use `npm ci` if you're not altering the dependency list or changing the versions of your dependencies.
  - Alternatively, use `npm install` if you've altered the dependency list or changed the version of one of your dependencies. This is also necessary if you change the app's version number.

- Run the app:
  - Use `npm run production` to run in production mode.
    - Available shorthands:
      - `npm run prod`
      - `npm run p`
      - `npm start`
  - Use `npm run development` to run in development mode.
    - Available shorthands:
      - `npm run dev`
      - `npm run d`
  - Use `npm run production-proxy` to run the app in production mode, but with `localhostOnly` set to true and `hostPublic` set to false. This mode will make it so your app only listens to requests coming from localhost and does not serve anything in the public folder. This mode is useful when you want to host your app behind a reverse proxy from a web server like Apache or nginx and [is considered a best practice for Node.js deployments](https://expressjs.com/en/advanced/best-practice-performance.html#use-a-reverse-proxy).
    - Available shorthands:
      - `npm run prodproxy`
      - `npm run x`
  - See [docs](https://rooseveltframework.org/docs/latest/configuration/#commandlineusage) for more information about configuring and running Roosevelt apps.

## Customize deployment

To set a global system prompt to provide the model context to use before answering, set the environment variable `NO_DRAMA_OLLAMA_CONTEXT_FOLDER` to a directory containing [markdown](https://en.wikipedia.org/wiki/Markdown) (*.md) files with instructions for the model.
