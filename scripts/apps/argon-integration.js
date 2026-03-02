import { MODULE_ID } from "../constants.js";

/**
 * RNK Quick Chug - Argon Combat HUD Integration
 * Transforms the first belt-slot potion in Argon into a single
 * "Quick Chug Belt" bonus-action button.  All other belt-slot items are hidden.
 */
export function registerArgonIntegration() {
  // Track whether we already placed the belt button this render cycle.
  let beltPlaced = false;

  Hooks.on("renderItemButtonArgonComponent", (itemButton, element, actor) => {
    if (!actor || !itemButton?.item?.id) return;

    let slots;
    try {
      slots = actor.getFlag(MODULE_ID, "slots");
    } catch {
      return;
    }
    if (!Array.isArray(slots)) return;

    const beltIds = new Set(slots.filter((id) => typeof id === "string" && id.length > 0));
    if (beltIds.size === 0) return;
    if (!beltIds.has(itemButton.item.id)) return;

    // ── This item is in the belt ──────────────────────────────────────────

    if (!beltPlaced) {
      // Transform the first belt item into the belt button
      beltPlaced = true;
      // Reset after this render frame so the next HUD render starts fresh
      requestAnimationFrame(() => { beltPlaced = false; });

      // Swap icon to the belt icon
      element.style.backgroundImage = `url("modules/enhancedcombathud/icons/drink-me.webp")`;
      element.style.filter = "";

      // Swap label
      const title = element.querySelector(".feature-element-title");
      if (title) title.textContent = game.i18n.localize("rnk-quick-chug.belt.label") || "Quick Chug Belt";

      // Hide the quantity badge — the belt isn't a single item
      const qty = element.querySelector("[class^='quantity']");
      if (qty) qty.style.display = "none";

      // Override click → open the belt app instead of using the potion
      element.onmouseup = async (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (event.button === 0) {
          try {
            if (globalThis.QC_ENGINE?.toggleApp) {
              await globalThis.QC_ENGINE.toggleApp();
            }
          } catch (err) {
            console.error(`[${MODULE_ID}] Failed to open belt:`, err);
          }
        }
      };

      console.log(`[${MODULE_ID}] Belt button placed in Argon HUD.`);
    } else {
      // Hide additional belt items — only one belt button needed
      element.style.display = "none";
    }
  });
}
