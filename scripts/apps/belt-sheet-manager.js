import { MODULE_ID, BELT_SLOTS, useItemFree } from "../constants.js";

/**
 * Belt Sheet Manager
 * Purpose: Inject Quick Chug belt UI into Actor Sheets via renderActorSheet hook.
 * Bible ref: 05-event-listeners (native DOM), 22-hook-reference (renderActorSheet)
 */
export class BeltSheetManager {
  constructor(actor) {
    this.actor = actor;
  }

  async injectBeltUI(html) {
    // Normalise to raw HTMLElement — v13 passes Element, v12 passes jQuery.
    // Duck-type on querySelector so this works in both Foundry and Node tests.
    const root = (html && typeof html.querySelector === "function") ? html : html?.[0];
    if (!root) return;

    // Find injection target first
    const containers = root.querySelector(".top ul.containers");
    const topDiv = containers?.parentElement ?? root.querySelector(".top");
    if (!topDiv) {
      console.warn(`[${MODULE_ID}] No injection point found on actor sheet.`);
      return;
    }

    // Guard: never inject twice — check the actual target, not root
    if (topDiv.querySelector(".rnk-quick-chug-belt-container")) return;

    const context = {
      slots: await this.getBeltSlots(),
      MODULE_ID
    };

    const markup = await renderTemplate(
      `modules/${MODULE_ID}/templates/belt-section.hbs`,
      context
    );

    if (containers) {
      containers.insertAdjacentHTML("afterend", markup);
    } else {
      topDiv.insertAdjacentHTML("beforeend", markup);
    }

    // Bind events to the injected container using native DOM — bible 05
    const container = root.querySelector(".rnk-quick-chug-belt-container");
    if (container) this._bindEvents(container);
  }

  async getBeltSlots() {
    const slots = this.actor.getFlag(MODULE_ID, "slots") || Array(BELT_SLOTS).fill(null);
    return slots.map((id, index) => {
      const item = id ? this.actor.items.get(id) : null;
      return { index, item };
    });
  }

  // Native DOM event delegation — bible 05, no jQuery
  _bindEvents(container) {
    container.addEventListener("click", async (ev) => {
      const slot = ev.target.closest(".qc-slot");
      if (!slot) return;

      if (ev.target.closest(".qc-clear-btn")) {
        ev.stopPropagation();
        await this.setSlot(Number(slot.dataset.slotIndex), null);
        return;
      }

      await this.useSlot(Number(slot.dataset.slotIndex));
    });

    container.addEventListener("dragover", (ev) => {
      if (ev.target.closest(".qc-slot")) ev.preventDefault();
    });

    container.addEventListener("drop", async (ev) => {
      const slot = ev.target.closest(".qc-slot");
      if (!slot) return;
      ev.preventDefault();
      try {
        const data = JSON.parse(ev.dataTransfer.getData("text/plain"));
        if (data.type === "Item") await this.setSlot(Number(slot.dataset.slotIndex), data.uuid);
      } catch (err) {
        console.error(`[${MODULE_ID}] Drop error:`, err);
      }
    });
  }

  async useSlot(index) {
    const slots = this.actor.getFlag(MODULE_ID, "slots") || [];
    const id = slots[index];
    if (!id) return;
    const item = this.actor.items.get(id);
    if (item) await useItemFree(item);
  }

  async setSlot(index, uuid) {
    const slots = this.actor.getFlag(MODULE_ID, "slots") || Array(BELT_SLOTS).fill(null);

    if (!uuid) {
      slots[index] = null;
      return this.actor.setFlag(MODULE_ID, "slots", slots);
    }

    let item;
    try {
      item = await fromUuid(uuid);
    } catch (err) {
      console.error(`[${MODULE_ID}] Could not resolve UUID: ${uuid}`, err);
      return ui.notifications.error("Could not resolve dropped item.");
    }

    if (!item) return ui.notifications.warn("Dropped item not found.");

    if (item.parent?.id === this.actor.id) {
      slots[index] = item.id;
    } else if (item.documentName === "Item") {
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
  }
}
