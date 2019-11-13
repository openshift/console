export const packageJson1 = `{
  "name": "blog",
  "private": true,
  "description": "My personal blog by Gatsby and Markdown",
  "version": "0.1.0",
  "author": "Rohit Rai <rohitkrai03@gmail.com>",
  "bugs": {
    "url": "https://github.com/rohitkrai03/blog/issues"
  },
  "dependencies": {
    "gatsby": "^2.0.76",
    "gatsby-image": "^2.0.22",
    "gatsby-plugin-feed": "^2.0.8",
    "gatsby-plugin-google-analytics": "^2.0.5",
    "gatsby-plugin-manifest": "^2.0.5",
    "gatsby-plugin-offline": "^2.0.5",
    "gatsby-plugin-react-helmet": "^3.0.0",
    "gatsby-plugin-sharp": "^2.0.6",
    "gatsby-plugin-typography": "^2.2.0",
    "gatsby-remark-copy-linked-files": "^2.0.5",
    "gatsby-remark-images": "^2.0.4",
    "gatsby-remark-prismjs": "^3.0.0",
    "gatsby-remark-responsive-iframe": "^2.0.5",
    "gatsby-remark-smartypants": "^2.0.5",
    "gatsby-source-filesystem": "^2.0.2",
    "gatsby-transformer-remark": "^2.1.6",
    "gatsby-transformer-sharp": "^2.1.3",
    "prismjs": "^1.15.0",
    "react": "^16.5.1",
    "react-dom": "^16.5.1",
    "react-helmet": "^5.2.0",
    "react-typography": "^0.16.13",
    "typeface-merriweather": "0.0.43",
    "typeface-montserrat": "0.0.43",
    "typography": "^0.16.17",
    "typography-theme-wordpress-2016": "^0.15.10"
  },
  "devDependencies": {
    "eslint": "^4.19.1",
    "eslint-plugin-react": "^7.11.1",
    "gh-pages": "^2.0.1",
    "prettier": "^1.14.2"
  },
  "homepage": "https://github.com/rohitkrai03/blog#readme",
  "keywords": [
    "gatsby"
  ],
  "license": "MIT",
  "main": "n/a",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/rohitkrai03/blog.git"
  },
  "scripts": {
    "dev": "gatsby develop",
    "lint": "eslint --ext .js,.jsx --ignore-pattern public .",
    "test": "echo Write tests! -> https://gatsby.app/unit-testing",
    "format": "prettier --trailing-comma es5 --no-semi --single-quote --write 'src/**/*.js' 'src/**/*.md'",
    "develop": "gatsby develop",
    "start": "npm run develop",
    "build": "gatsby build",
    "deploy": "gatsby build --prefix-paths && gh-pages -d public"
  }
}`;

export const packageJson2 = `{
  "name": "nodejs-rest-http-crud",
  "version": "3.0.1",
  "description": "",
  "author": "Red Hat, Inc.",
  "license": "Apache-2.0",
  "scripts": {
    "test": "tape test/*.js | tap-spec",
    "test:integration": "tape test/integration/*.js | tap-spec",
    "test:integration:undeploy": "nodeshift --strictSSL=false undeploy",
    "lint": "xo",
    "coverage": "nyc npm test",
    "coveralls": "nyc npm test && nyc report --reporter=text-lcov | coveralls",
    "ci": "npm run lint && npm run coveralls",
    "release": "standard-version -a",
    "openshift": "nodeshift --strictSSL=false --imageTag=12.x",
    "postinstall": "license-reporter report -s && license-reporter save -s --xml licenses.xml",
    "start": "node ."
  },
  "main": "./bin/www",
  "standard-version": {
    "scripts": {
      "postbump": "npm run postinstall && node release.js",
      "precommit": "git add .openshiftio/application.yaml licenses/"
    }
  },
  "xo": {
    "space": 2,
    "rules": {
      "space-before-function-paren": [
        "error",
        "always"
      ]
    }
  },
  "files": [
    "package.json",
    "app.js",
    "public",
    "bin",
    "lib",
    "LICENSE",
    "licenses"
  ],
  "repository": {
    "type": "git",
    "url": "git+https://github.com/nodeshift-starters/nodejs-rest-http-crud.git"
  },
  "bugs": {
    "url": "https://github.com/nodeshift-starters/nodejs-rest-http-crud/issues"
  },
  "homepage": "https://github.com/nodeshift-starters/nodejs-rest-http-crud#readme",
  "devDependencies": {
    "coveralls": "^3.0.0",
    "js-yaml": "^3.13.1",
    "nodeshift": "~3.0.0",
    "nyc": "~14.1.0",
    "proxyquire": "^2.0.0",
    "rhoaster": "~0.2.0",
    "standard-version": "^6.0.1",
    "supertest": "^4.0.2",
    "tap-spec": "~5.0.0",
    "tape": "~4.10.0",
    "xo": "~0.24.0"
  },
  "dependencies": {
    "body-parser": "~1.19.0",
    "debug": "^4.0.1",
    "express": "4.17.1",
    "kube-probe": "^0.3.1",
    "license-reporter": "^1.2.0",
    "pg": "^7.8.2"
  }
}`;
