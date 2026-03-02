import { MODULE_ID, BELT_SLOTS, useItemFree } from "../constants.js";

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
    this._busy = false; // use-lock — prevents concurrent item.use() calls
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
    const grid = html.querySelector(".qc-grid");
    if (!grid) return;

    // ── Event delegation on the stable grid container ──────────────────────
    // One listener per event type — never accumulates across re-renders.

    grid.addEventListener("click", async (ev) => {
      const clearBtn = ev.target.closest(".qc-clear-btn");
      const slot = ev.target.closest(".qc-slot");
      if (!slot) return;

      if (clearBtn) {
        ev.stopPropagation();
        await this._setSlot(Number(slot.dataset.slotIndex), null);
        return;
      }

      await this._useSlot(Number(slot.dataset.slotIndex));
    });

    grid.addEventListener("dragover", (ev) => {
      if (ev.target.closest(".qc-slot")) ev.preventDefault();
    });

    grid.addEventListener("drop", async (ev) => {
      const slot = ev.target.closest(".qc-slot");
      if (!slot) return;
      ev.preventDefault();
      try {
        const data = JSON.parse(ev.dataTransfer.getData("text/plain"));
        if (data.type === "Item") {
          await this._setSlot(Number(slot.dataset.slotIndex), data.uuid);
        }
      } catch (err) {
        console.error(`[${MODULE_ID}] Drop error:`, err);
      }
    });
  }

  async _useSlot(index) {
    // Lock — one use at a time, prevents double-fire from event accumulation
    // or rapid clicks consuming multiple potions in a single interaction.
    if (this._busy) return;
    this._busy = true;
    try {
      const slots = this.actor.getFlag(MODULE_ID, "slots") || [];
      const id = slots[index];
      if (!id) {
        ui.notifications.info("This slot is empty.");
        return;
      }

      const item = this.actor.items.get(id);
      if (!item) {
        ui.notifications.error("Item no longer exists on actor.");
        return;
      }

      await useItemFree(item);
      this.render({ force: true });
    } finally {
      this._busy = false;
    }
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
