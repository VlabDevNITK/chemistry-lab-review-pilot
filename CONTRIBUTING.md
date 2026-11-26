# Contributing experiments to this lab

## Repository model
This repository contains the lab website and multiple experiment folders. The `main` branch is the approved, mentor-facing version.

## Developer workflow
1. Clone this lab repository.
2. Create a branch for your assigned experiment:
   `developer/<developer-id>/<experiment-id>`
3. Use the `development-experiment-template` repository as the content template.
4. Add your experiment under `experiments/<experiment-id>/`.
5. Keep the required filenames and the `simulation/index.html` entry point.
6. Push your branch and open a Pull Request targeting `main`.
7. Wait for automated validation and admin review. Do not merge your own Pull Request.

## Required experiment files
- `aim.md`
- `theory.md`
- `pretest.json`
- `procedure.md`
- `simulation/index.html` and all simulation assets
- `posttest.json`
- `references.md`
- `contributors.md`

## Configuration
The admin maintains `config.json`. A new experiment appears on the lab website only after its folder is registered in the `experiments` array and the Pull Request is merged.

## Important
- Do not edit the lab website files (`index.html`, `script.js`, `style.css`) unless specifically assigned.
- Do not edit another developer's experiment folder.
- Do not commit secrets, API keys or private information.
- The mentor-facing GitHub Pages site is public. Only submit content approved for public access.
