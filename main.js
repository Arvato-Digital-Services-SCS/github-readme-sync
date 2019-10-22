const core = require('@actions/core');
const github = require('@actions/github');
const request = require('request-promise-native');
const stream = require('stream');

async function run() {
  try {
    const readmeKey = core.getInput('readme-api-key', { required: true });
    const apiFilePath = core.getInput('api-file-path', { required: true });
    const token = core.getInput('repo-token', { required: true });
  
    const client = new github.GitHub(token);

    const apiFile = await client.repos.getContents({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      path: apiFilePath,
    });

    const Readable = stream.Readable;
    const s = new Readable();
    s._read = () => { }; // redundant? see update below
    s.push(new Buffer(apiFile.data.content, 'base64').toString('ascii'))
    s.push(null);

    const options = {
      formData: {
        spec: s,
      },
      headers: {
        'x-readme-version': 1.0,
        'x-readme-source': 'github',
      },
      auth: { user: readmeKey },
      resolveWithFullResponse: true,
    };

    return request.post('https://dash.readme.io/api/v1/api-specification', options).then(console.log, console.log);
  
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
