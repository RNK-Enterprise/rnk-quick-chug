import { MODULE_ID, BELT_SLOTS } from "../constants.js";

/**
 * RNK Quick Chug - Belt Quick Access
 * Version: 1.0.0
 * Implementation: ApplicationV2 (Foundry VTT v13 Standard)
 */
const { ApplicationV2, HandlebarsApplicationMixin } = typeof foundry !== "undefined"
  ? foundry.applications.api
  : { ApplicationV2: class {}, HandlebarsApplicationMixin: (cls) => cls };

export class QuickChugApp extends HandlebarsApplicationMixin(ApplicationV2) {
  static DEFAULT_OPTIONS = {
    id: "rnk-quick-chug-belt",
    classes: ["rnk-quick-chug"],
    tag: "form",
    window: {
      title: "RNK Quick Chug Belt",
      icon: "fas fa-flask",
      resizable: false,
      controls: []
    },
    position: {
      width: 320,
      height: "auto"
    }
  };

  static PARTS = {
    main: {
      template: `modules/${MODULE_ID}/templates/belt-app.hbs`
    }
  };

  constructor(options = {}) {
    super(options);
  }

  /**
   * Resolve actor: primary character first, then currently controlled token.
   * This ensures clients without a Primary Character set still work.
   */
  get actor() {
    return game.user.character ?? canvas.tokens?.controlled?.[0]?.actor ?? null;
  }

  async _prepareContext() {
    if (!this.actor) {
      return { slots: [], error: "Select a token or assign a Primary Character." };
    }

    const flagData = this.actor.getFlag(MODULE_ID, "slots") || Array(BELT_SLOTS).fill(null);
    const slots = flagData.map((id, index) => {
      const item = id ? this.actor.items.get(id) : null;
      return {
        index,
        item,
        isEmpty: !item,
        img: item?.img || "icons/svg/item-bag.svg",
        name: item?.name || "Empty Slot"
      };
    });

    return {
      slots,
      actor: this.actor,
      isGM: game.user.isGM
    };
  }

  _onRender(context, options) {
    const html = this.element;

    html.querySelectorAll(".qc-slot").forEach(el => {
      el.addEventListener("click", async (ev) => {
        // Don't fire use if the clear button was clicked
        if (ev.target.closest(".qc-clear-btn")) return;
        const idx = ev.currentTarget.dataset.slotIndex;
        await this._useSlot(Number(idx));
      });

      el.addEventListener("dragover", (ev) => {
        ev.preventDefault();
      });

      el.addEventListener("drop", async (ev) => {
        ev.preventDefault();
        const idx = ev.currentTarget.dataset.slotIndex;
        try {
          const data = JSON.parse(ev.dataTransfer.getData("text/plain"));
          if (data.type === "Item") {
            await this._setSlot(Number(idx), data.uuid);
          }
        } catch (err) {
          console.error(`[${MODULE_ID}] Drop error:`, err);
        }
      });
    });

    html.querySelectorAll(".qc-clear-btn").forEach(el => {
      el.addEventListener("click", async (ev) => {
        ev.stopPropagation();
        const idx = ev.currentTarget.closest(".qc-slot").dataset.slotIndex;
        await this._setSlot(Number(idx), null);
      });
    });
  }

  async _useSlot(index) {
    const slots = this.actor.getFlag(MODULE_ID, "slots") || [];
    const id = slots[index];
    if (!id) return ui.notifications.info("This slot is empty.");

    const item = this.actor.items.get(id);
    if (!item) return ui.notifications.error("Item no longer exists on actor.");

    await item.use();
    this.render({ force: true });
  }

  async _setSlot(index, uuid) {
    const slots = this.actor.getFlag(MODULE_ID, "slots") || Array(BELT_SLOTS).fill(null);

    if (!uuid) {
      // Clear slot
      slots[index] = null;
      await this.actor.setFlag(MODULE_ID, "slots", slots);
      return this.render({ force: true });
    }

    // Resolve the item from the UUID
    let item;
    try {
      item = await fromUuid(uuid);
    } catch (err) {
      console.error(`[${MODULE_ID}] Could not resolve UUID: ${uuid}`, err);
      return ui.notifications.error("Could not resolve dropped item.");
    }

    if (!item) return ui.notifications.warn("Dropped item not found.");

    // If item is embedded on this actor, use its local id directly
    if (item.parent?.id === this.actor.id) {
      slots[index] = item.id;
    } else if (item.documentName === "Item") {
      // World/compendium item — find a matching item on the actor by name
      const match = this.actor.items.find(i => i.name === item.name);
      if (match) {
        slots[index] = match.id;
      } else {
        return ui.notifications.warn(
          `"${item.name}" is not in your inventory. Drag from your character sheet.`
        );
      }
    } else {
      return ui.notifications.warn("Only items from your inventory can be assigned.");
    }

    await this.actor.setFlag(MODULE_ID, "slots", slots);
    this.render({ force: true });
  }
}
