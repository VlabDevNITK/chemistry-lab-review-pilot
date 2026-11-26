# Chemistry Lab – Automated Review Website (Pilot)

This pilot uses one GitHub repository per lab and one folder per experiment.

## Structure
- `index.html`, `style.css`, `script.js`: reusable lab review website.
- `config.json`: lab metadata and experiment registry.
- `experiments/<experiment-id>/`: individual experiment content.
- `.github/workflows/deploy.yml`: pull-request validation and GitHub Pages deployment.
- `validate.py`: required-file and quiz JSON validation.

## Local preview
Run a local static server from this directory, for example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

Do not open `index.html` directly using `file://`; browsers block fetch requests to local files.

## GitHub setup
1. Create/use the lab repository and push this project to `main`.
2. In repository Settings → Pages, select **GitHub Actions** as the build and deployment source.
3. Protect `main` with a ruleset/branch protection rule:
   - Require a pull request before merging.
   - Require the `validate` workflow to pass.
   - Restrict direct pushes to administrators.
4. Give developers repository write access only if they need to push branches directly. Otherwise use forks and PRs.
5. Developers submit changes through PRs; admins review and merge.
6. A successful push/merge to `main` deploys the public mentor-facing site.

## Preview URLs
- Lab homepage: `https://<owner>.github.io/<repository>/`
- Specific experiment: `https://<owner>.github.io/<repository>/?experiment=<experiment-id>`

## Pilot note
The supplied experiment folder was named for copper-in-brass, while its simulation title and documentation identify EDTA hardness of water. The pilot folder uses `edta-hardness-of-water` based on the simulation title. Confirm this mapping before publishing.
