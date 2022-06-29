# Annotate changed lines in this pr that are uncovered

The coverage informatio is got from the (jest) output json. If a file is ignored from coverage it does not appear in the
coverage results and thus does not get flagged as uncovered by this action.

## Usage

add following to your steps

```
    - name: annotate uncovered lines
      uses: smartlyio/annotate-uncovered-lines-action
      with:
        coverage-file: coverage/coverage-final.json
        base-ref: origin/${{github.base_ref}}
```

Note that the action uses `git` internally so it requires a full clone of the repository prior to running.
This is easiest to achieve with:

```
    - uses: actions/checkout@v3
      with:
        fetch-depth: 0
```
