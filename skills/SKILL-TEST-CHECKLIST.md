# Skill Test Checklist

Always verify after creating a new Skill or modifying an existing one.

## 1. Trigger Test
- [ ] Does it activate with various natural language expressions?
- [ ] Does it work in both Korean and English?
- [ ] Do the trigger expressions listed in the description actually match?

## 2. Negative Test
- [ ] Does it stay inactive for unrelated requests?
- [ ] Does it distinguish similar but different Skill domain requests?
- [ ] Do the "do not activate on" expressions listed in the description actually get filtered out?

## 3. Format Test
- [ ] Does the output follow the template and examples?
- [ ] Are all required sections present?
- [ ] Is the Report Format consistent?

## 4. Gotcha Test
- [ ] Does it mark uncertain cases as "needs confirmation"?
- [ ] Does it avoid the mistakes listed in Gotchas?
- [ ] Does it respect escalation conditions (e.g., 3 failures)?

## 5. Boundary Test
- [ ] Is there no scope creep for similar but different requests?
- [ ] Does it request additional information when input is insufficient?
- [ ] Does it handle empty or ambiguous input safely?

## Test Method
1. Test in a Claude session with actual prompts
2. Try at least 3 Trigger and 3 Negative expressions each
3. Save results as good output examples in examples/
4. If failure patterns are found, add them to Gotchas
