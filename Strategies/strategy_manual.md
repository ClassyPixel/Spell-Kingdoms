# Spell Kingdoms — Strategy Manual
> This file is used to train the opponent AI. Add new strategies below.
> Each strategy should describe a coherent play pattern, goal, and conditions.

---

## Format

```
### [Strategy Name]
**Goal:** What this strategy aims to achieve.
**Condition:** When to use this strategy.
**Tactics:**
- Tactic 1
- Tactic 2
**Priority:** Offensive | Defensive | Support
```

---

<!-- Add strategies below this line -->
[FullOffensive]
Goal: Elite summons attack at all times.
Condition: This strategy is used when opponent haves elite summons that can currently destroy an opponent elite summon.
Tactics:
- Opponent moves elite summons to seek the weakest player Elite summon and attacks them.
- If target player elite summon gains more health during this strategy, switch to another strategy if opponent elite summon can no longer destroy that elite summon target with a single attack
- Opponent moves elite summons in all directions possible, if required to reach target player elite summon faster
Priority: Offensive

[Balanced]
Goal: Toggles between stacking summons, attacking elites and attacking champions
Condition: This strategy should always be an opponent's default strategy, and switches to other strategies when their certain conditions are met.
Tactics:
- Focus on staking at least 1 or more summons before rallying.
- When rallying, focus on destroying player champions, and move in all directions if neccessary to avoid confronting player elite summons
- Focus on attacking player elite summons, if player elite attacked first, or if player elite summon that can be destroyed with a single attack is in combat range.
Priority: Offensive | Deffensive

[AbosoluteDefense]
Goal: Focuses on gaining as much summon stacks as possible and protect champions from player elite summons
Condition: Used mostly when beggining the match, or when there's 2 or more palyer elite summons in the enemy line
Tactics:
- Opponent leaves elite summons in front of champions until at least one of them haves 2 summon stacked
- Elite summons guarding the champions attack any opponent elite summons in range
- If player elite summons are attaking two or more opponent champions, retreat o move as quickly as possible to attack those player elite summons until destroyed.
Priority: Defensive

[Coward]
Goal: Opponent elite summon Avoids being destroyed by player elite summons. The idea is to protect valuable elite summons from being destroyed
Condition: Used when opponent elite summon in enemy lines haves low health and is vulnerable to being destroyed by a player elite summon.
Tactics:
- Prioritize this strategy only for the strongest opponent elite summon.
- An elite summon that has permanently increased its stats more than once by an ability or a spell card should prioritize on using this strategy.
- Always use retreat when available.
- If there is a terrain that can heal the low health elite summon prioritize on using that terrain.
Priority: Defensive

[TerrainAdvantage]
Goal: Use terrains to gain advantage in combat, or heal.
Condition: Used when near a terrain that can benefit the opponent elite summon or stacked summons
Tactics:
- Go to a terrain if terrain is nearby and can heal a low health elite summon.
- Go to a terrain if terrain increases stats and a player elite summon or champion is in range and can be attacked using the terrain stat boost.
Priority: Suppor | Defensive

[Innitiative]
Goal: Attack a player's elite summon before it can attack opponent elite summon.
Condition: Used when player elite moves near opponent elite summon, but needs to move an additional cell to be in tacck range. Mostly used when player moves their elite summons for the first time in the match.
Tactics:
- Prioritize this strategy if opponent elite summon has not taken any damage and is near a player elite summon that has not taken any damage either.
- Check if player elite summon that moved for the first time in the match moved near and opponent elite summon and haves weaker stats. During opponent strategy phase, rally to the cell in range to attack the player elite summon.
- Switch to another strategy it target player elite summon attacked the opponent summon first.