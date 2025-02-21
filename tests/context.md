# Clarity Contract Testing

Here is an example of a Clarity contract that we have already tested.

```
{example_clarity_contract}
```

Here is an example of solid test output for this contract. It covers all of the public functions and read-only functions for their error branches, then success branches, with a few variations depending on the parameters and functionality.

```
{example_clarinet_js_sdk_output}
```

Here are some common items defined in each test:

```
{example_imported_helpers}
{example_matching_constants}
{example_account_config}
```

Each test is grouped by the function name, and our goals in this session include:

1. look at the clarity code provided as context in the attached .clar file
2. assess whether all tests are complete given the criteria and examples above

If the tests are complete based on the criteria simply say there is no more work to do, we're done!

If the tests are not complete, let's focus on making one solid step progressing toward our goal. We will run this exact same process over and over until all tests are complete.
