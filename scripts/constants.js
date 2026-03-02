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
  hookId = Hooks.on("dnd5e.preUseActivity", (_activity, config) => {
    Hooks.off("dnd5e.preUseActivity", hookId);
    // Blank the activation type so dnd5e does not record an action/bonus-action spend.
    if (config?.activation) config.activation.type = "";
  });
  try {
    await item.use();
  } finally {
    // Safety: remove hook if item.use() threw before preUseActivity fired.
    Hooks.off("dnd5e.preUseActivity", hookId);
  }
}
