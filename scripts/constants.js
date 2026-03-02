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
    hookId = null;
    // Override activation type to "none" — a valid dnd5e type meaning "no action
    // cost required". This prevents the action/bonus-action pip from being spent
    // while still allowing quantity consumption, chat card, and item effects.
    if (!config.activation) config.activation = {};
    config.activation.type = "none";
    config.activation.cost = null;
  });
  try {
    await item.use();
  } finally {
    // Safety: remove hook if item.use() threw before preUseActivity fired.
    if (hookId !== null) Hooks.off("dnd5e.preUseActivity", hookId);
  }
}
