
# Condenser

Condenser is the react.js web interface to the
blockchain-based social media platform, Hive.blog.  It uses a
[Hive compatible blockchain](https://gitlab.syncad.com/hive/hive), powered by DPoS Governance and ChainBase DB to store JSON-based content for a plethora of web
applications.

## Why would I want to use Condenser?

* Learning how to build blockchain-based web applications using Hive compatible blockchain as a content storage mechanism in react.js
* Reviewing the inner workings of the Hive.blog social media platform
* Assisting with software development for Hive.blog and Hive.io

## Installation

#### Docker

If you would like to modify, build, and run condenser using docker, it's as
simple as pulling in the github repo and issuing one command to build it,
like this:

```bash
git clone https://gitlab.syncad.com/hive/condenser
cd condenser
docker build -t="myname/condenser:mybranch" .
docker run -it -p 8080:8080 myname/condenser:mybranch
```

#### Docker Compose

If you like to run and build condenser and additionally a reverse-proxy using an Nginx Docker image, with companion Letsencrypt (SSL) support, you can simple launch the Docker-compose files via the included `run.sh`-scripts.

```bash
git clone https://gitlab.syncad.com/hive/condenser
cd condenser
./run.sh start proxy            # to start the nginx reverse proxy (with ssl support)
./run.sh start (prod|dev|stg)   # to build and start the condensor image
./run.sh logs (prod|dev|stg)    # (optionally) to attach to the condensor image and inspect its logs
```

## Building from source without docker (the 'traditional' way):
(better if you're planning to do condenser development)

#### Clone the repository and make a tmp folder

```bash
git clone https://gitlab.syncad.com/hive/condenser
cd condenser
mkdir tmp
```

#### Install dependencies

Install at least Node.js v12 if you don't already have it.

Condenser is known to successfully build using node 12.6, npm 6.13.4, and
yarn 1.22.4.

We use the yarn package manager instead of the default `npm`. There are
multiple reasons for this, one being that we have `hive-js` built from
source pulling the gitlab repo as part of the build process and yarn
supports this. This way the library that handles keys can be loaded by
commit hash instead of a version name and cryptographically verified to be
exactly what we expect it to be. Yarn can be installed with `npm`, but
afterwards you will not need to use `npm` further.

```bash
npm install -g yarn
yarn add babel-cli
yarn install --frozen-lockfile --ignore-optional
yarn run build
```
To run condenser in production mode, run:

```bash
yarn run production
```

When launching condenser in production mode it will automatically use 1
process per available core. You will be able to access the front-end at
http://localhost:8080 by default.

To run condenser in development mode, run:

```bash
yarn run start
```

It will take quite a bit longer to start in this mode (~60s) as it needs to
build and start the webpack-dev-server.

By default you will be connected to community public api node at
`https://api.hive.blog`. This is actually on the real blockchain and
you would use your regular account name and credentials to login - there is
not an official separate testnet at this time. If you intend to run a
full-fledged site relying on your own, we recommend looking into running a
copy of `hive (steemd)` locally instead
[https://gitlab.syncad.com/hive/hive](https://gitlab.syncad.com/hive/hive).

#### Debugging SSR code

`yarn debug` will build a development version of the codebase and then start the
local server with `--inspect-brk` so that you can connect a debugging client.
You can use Chromium to connect by finding the remote client at
`chrome://inspect/#devices`.

#### Configuration

The intention is to configure condenser using environment variables. You
can see the names of all of the available configuration environment
variables in `config/custom-environment-variables.json`. Default values are
stored in `config/defaults.json`.

Environment variables using an example like this:

```bash
export SDC_CLIENT_STEEMD_URL="https://api.hive.blog"
export SDC_SERVER_STEEMD_URL="https://api.hive.blog"
```

Keep in mind environment variables only exist in your active session, so if
you wish to save them for later use you can put them all in a file and
`source` them in.

If you'd like to statically configure condenser without variables you can
edit the settings directly in `config/production.json`. If you're running
in development mode, copy `config/production.json` to `config/dev.json`
with `cp config/production.json config/dev.json` and adjust settings in
`dev.json`.

If you're intending to run condenser in a production environment one
configuration option that you will definitely want to edit is
`server_session_secret` which can be set by the environment variable
`SDC_SESSION_SECRETKEY`. To generate a new value for this setting, you can
do this:

```bash
node
> crypto.randomBytes(32).toString('base64')
> .exit
```

## Style Guides For Submitting Pull Requests

### File naming and location

- Prefer CamelCase js and jsx file names
- Prefer lower case one word directory names
- Keep stylesheet files close to components
- Component's stylesheet file name should match component name

#### Js & Jsx

We use [prettier](https://github.com/prettier/prettier) to autofromat the
code, with [this configuration](.prettierrc). Run `yarn run fmt` to format
everything in `src/`, or `yarn exec -- prettier --config .prettierrc
--write src/whatever/file.js` for a specific file.

#### CSS & SCSS

If a component requires a css rule, please use its uppercase name for the
class, e.g. "Header" class for the header's root div.  We adhere to BEM
methodology with exception for Foundation classes, here is an example for
the Header component:

```html
<!-- Block -->
<ul class="Header">
  ...
  <!-- Element -->
  <li class="Header__menu-item">Menu Item 1</li>
  <!-- Element with modifier -->
  <li class="Header__menu-item--selected">Element with modifier</li>
</ul>
```

## Storybook

`yarn run storybook`

## Testing

### Run test suite

`yarn test`

will run `jest`

### Test endpoints offline

If you want to test a server-side rendered page without using the network, do this:

```
yarn build
OFFLINE_SSR_TEST=true NODE_ENV=production node --prof lib/server/index.js
```

This will read data from the blobs in `api_mockdata` directory. If you want to use another set of mock data, create a similar directory to that one and add an argument `OFFLINE_SSR_TEST_DATA_DIR` pointing to your new directory.

## Issues

To report a non-critical issue, please file an issue on this GitHub project.

If you find a security issue please report details to trusted community members.

We will evaluate the risk and make a patch available before filing the issue.
