import { MODULE_ID, BELT_SLOTS } from "../constants.js";

/**
 * RNK Quick Chug - Argon Combat HUD Integration
 * Injects Quick Chug belt items into the existing Bonus Action panel.
 * Only activates when enhancedcombathud is installed and active.
 */
export function registerArgonIntegration() {
  Hooks.on("argonInit", (CoreHud) => {
    const { ActionButton } = CoreHud.ARGON.MAIN.BUTTONS;

    class QuickChugSlotButton extends ActionButton {
      constructor(item) {
        super();
        this._item = item;
      }

      get label() {
        return this._item?.name ?? "";
      }

      get icon() {
        return this._item?.img ?? "icons/svg/item-bag.svg";
      }

      get quantity() {
        const qty = this._item?.system?.quantity;
        return Number.isNumeric(qty) ? qty : null;
      }

      get colorScheme() {
        return 1;
      }

      async _onLeftClick() {
        if (!this._item) {
          return ui.notifications.info(
            game.i18n.localize("rnk-quick-chug.notification.emptySlot")
          );
        }

        try {
          await this._item.use();
        } catch (err) {
          console.error(`[${MODULE_ID}] Failed to use item:`, err);
          ui.notifications.error(
            game.i18n.format("rnk-quick-chug.notification.failed", {
              itemName: this._item.name
            })
          );
        }
      }
    }

    // Inject belt items into the existing bonus action panel after HUD renders
    async function injectIntoBonusPanel(hud) {
      const actor = hud?._actor;
      if (!actor) {
        return;
      }

      // Find the bonus action panel (colorScheme === 1)
      const bonusPanel = hud.components?.main?.find(p => p.colorScheme === 1);
      if (!bonusPanel) {
        return;
      }

      // Don't inject twice
      if (bonusPanel.element?.querySelector(".qc-argon-belt")) {
        return;
      }

      const flagSlots = actor.getFlag(MODULE_ID, "slots") ?? Array(BELT_SLOTS).fill(null);
      const items = flagSlots
        .filter(id => id)
        .map(id => actor.items.get(id))
        .filter(Boolean);

      if (!items.length) {
        return;
      }

      // Create belt buttons, render, and append to the bonus panel
      for (const item of items) {
        const btn = new QuickChugSlotButton(item);
        btn._parent = bonusPanel;
        btn.element.classList.add("qc-argon-belt");
        bonusPanel.element.appendChild(btn.element);
        await btn.render();
      }
    }

    // Hook into HUD render events
    Hooks.on("renderApplication", (app) => {
      if (app?.constructor?.name === "CoreHud") {
        injectIntoBonusPanel(app);
      }
    });
    Hooks.on("renderApplicationV2", (app) => {
      if (app?.constructor?.name === "CoreHud") {
        injectIntoBonusPanel(app);
      }
    });
    Hooks.on("argon-onSetChangeComplete", (hud) => {
      injectIntoBonusPanel(hud);
    });

    console.log(`[${MODULE_ID}] Argon Combat HUD integration registered.`);
  });
}
