/**
 * RNK Quick Chug - Constants
 * Single source of truth - imported by all sub-modules.
 */
export const MODULE_ID = "rnk-quick-chug";
export const BELT_SLOTS = 5;

/**
 * Use an item without charging the action economy.
 * Hooks once into dnd5e.preUseActivity (v3 Activity system) to null out the
 * activation cost before item.use() fires, so Argon's action pips and the
 * dnd5e combat tracker are NOT decremented for belt uses.
 * Quantity, chat card, and item effects still process normally.
 *
 * @param {Item} item - The Foundry Item document to use.
 */
export async function useItemFree(item) {
  let hookId;
  hookId = Hooks.on("dnd5e.preUseActivity", (_activity, usageConfig) => {
    Hooks.off("dnd5e.preUseActivity", hookId);
    hookId = null;
    // dnd5e calls _prepareUsageConfig() BEFORE firing this hook, which means
    // usageConfig.consume.action is already set to true for action/bonus items.
    // Changing activation.type here is too late — we must directly override
    // consume.action so dnd5e's consume() step skips the action-economy deduction
    // while still processing quantity, chat card, and effects normally.
    if (usageConfig.consume && typeof usageConfig.consume === "object") {
      usageConfig.consume.action = false;
    } else if (usageConfig.consume !== false) {
      usageConfig.consume = { action: false };
    }
  });
  try {
    await item.use();
  } finally {
    // Safety: remove hook if item.use() threw before preUseActivity fired.
    if (hookId != null) Hooks.off("dnd5e.preUseActivity", hookId);
  }
}
