/**
 * RNK Quick Chug - Full Unit Test Suite
 * 100/100/100/100 Standard: Coverage, Pass Rate, Functionality, Performance
 */

import { jest } from "@jest/globals";
import { MODULE_ID, BELT_SLOTS } from "../scripts/constants.js";

// ─── Foundry Global Mocks ──────────────────────────────────────────────────
global.game = {
  user: { isGM: false, character: null },
  i18n: { localize: (k) => k, format: (k, _args) => k },
  settings: { register: jest.fn(), get: jest.fn() },
  modules: { get: jest.fn() }
};
global.ui = {
  notifications: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  }
};
global.fromUuid = jest.fn();
global.Hooks = { once: jest.fn(), on: jest.fn() };
global.renderTemplate = jest.fn().mockResolvedValue("<div>mock</div>");
global.foundry = {
  applications: {
    api: {
      ApplicationV2: class { constructor() {} render() {} close() {} },
      HandlebarsApplicationMixin: (cls) => cls
    }
  }
};

// ─── Helpers ──────────────────────────────────────────────────────────────
const makeItem = (name, id, quantity = 5, parentId = null) => ({
  id,
  name,
  img: "icons/svg/item-bag.svg",
  documentName: "Item",
  system: { quantity },
  use: jest.fn().mockResolvedValue(true),
  parent: parentId ? { id: parentId } : null
});

const makeActor = (items = [], flagSlots = null) => {
  const itemMap = new Map(items.map(i => [i.id, i]));
  return {
    id: "actor-test-001",
    getFlag: jest.fn((_mod, key) => key === "slots" ? flagSlots : null),
    setFlag: jest.fn().mockResolvedValue(true),
    items: {
      get: jest.fn(id => itemMap.get(id) ?? null),
      find: jest.fn(fn => items.find(fn) ?? null)
    }
  };
};

// ─── Constants ────────────────────────────────────────────────────────────
describe("RNK Constants", () => {
  test("MODULE_ID is rnk-quick-chug", () => {
    expect(MODULE_ID).toBe("rnk-quick-chug");
  });

  test("BELT_SLOTS is exactly 5", () => {
    expect(BELT_SLOTS).toBe(5);
  });
});

// ─── BeltSheetManager ─────────────────────────────────────────────────────
import { BeltSheetManager } from "../scripts/apps/belt-sheet-manager.js";

describe("BeltSheetManager - getBeltSlots", () => {
  test("returns 5 empty slots when no flag data", async () => {
    const actor = makeActor();
    const mgr = new BeltSheetManager(actor);
    const slots = await mgr.getBeltSlots();
    expect(slots).toHaveLength(BELT_SLOTS);
    expect(slots.every(s => s.item === null)).toBe(true);
  });

  test("resolves slot item by actor item id", async () => {
    const potion = makeItem("Healing Potion", "item-hp", 3, "actor-test-001");
    const flagSlots = ["item-hp", null, null, null, null];
    const actor = makeActor([potion], flagSlots);
    const mgr = new BeltSheetManager(actor);
    const slots = await mgr.getBeltSlots();
    expect(slots[0].item).toBe(potion);
    expect(slots[1].item).toBeNull();
  });

  test("returns null for stale item id not on actor", async () => {
    const flagSlots = ["stale-id", null, null, null, null];
    const actor = makeActor([], flagSlots);
    const mgr = new BeltSheetManager(actor);
    const slots = await mgr.getBeltSlots();
    expect(slots[0].item).toBeNull();
  });
});

describe("BeltSheetManager - useSlot", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("does nothing on empty slot", async () => {
    const actor = makeActor([], Array(BELT_SLOTS).fill(null));
    const mgr = new BeltSheetManager(actor);
    await expect(mgr.useSlot(0)).resolves.toBeUndefined();
  });

  test("calls item.use() for valid slot", async () => {
    const potion = makeItem("Speed Potion", "item-spd");
    const slots = [null, null, "item-spd", null, null];
    const actor = makeActor([potion], slots);
    const mgr = new BeltSheetManager(actor);
    await mgr.useSlot(2);
    expect(potion.use).toHaveBeenCalledTimes(1);
  });

  test("does nothing when slot id is stale (item missing)", async () => {
    const slots = ["ghost-id", null, null, null, null];
    const actor = makeActor([], slots);
    const mgr = new BeltSheetManager(actor);
    await expect(mgr.useSlot(0)).resolves.toBeUndefined();
  });
});

describe("BeltSheetManager - setSlot", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("clears slot when uuid is null", async () => {
    const slots = ["item-001", null, null, null, null];
    const actor = makeActor([], slots);
    const mgr = new BeltSheetManager(actor);
    await mgr.setSlot(0, null);
    expect(actor.setFlag).toHaveBeenCalledWith(
      MODULE_ID,
      "slots",
      [null, null, null, null, null]
    );
  });

  test("stores embedded actor item by its id", async () => {
    const item = makeItem("Haste Potion", "item-haste", 2, "actor-test-001");
    global.fromUuid.mockResolvedValueOnce(item);
    const actor = makeActor([], null);
    const mgr = new BeltSheetManager(actor);
    await mgr.setSlot(0, "Actor.actor-test-001.Item.item-haste");
    const saved = actor.setFlag.mock.calls[0][2];
    expect(saved[0]).toBe("item-haste");
  });

  test("matches world item to actor item by name", async () => {
    const worldItem = makeItem("Potion of Healing", "world-123");
    global.fromUuid.mockResolvedValueOnce(worldItem);
    const actorItem = makeItem("Potion of Healing", "actor-456");
    const actor = makeActor([actorItem], null);
    actor.items.find = jest.fn(() => actorItem);
    const mgr = new BeltSheetManager(actor);
    await mgr.setSlot(1, "Item.world-123");
    const saved = actor.setFlag.mock.calls[0][2];
    expect(saved[1]).toBe("actor-456");
  });

  test("warns when world item has no match on actor", async () => {
    const worldItem = makeItem("Legendary Elixir", "world-999");
    global.fromUuid.mockResolvedValueOnce(worldItem);
    const actor = makeActor([], null);
    actor.items.find = jest.fn(() => null);
    const mgr = new BeltSheetManager(actor);
    await mgr.setSlot(0, "Item.world-999");
    expect(ui.notifications.warn).toHaveBeenCalled();
    expect(actor.setFlag).not.toHaveBeenCalled();
  });

  test("shows error notification on fromUuid failure", async () => {
    global.fromUuid.mockRejectedValueOnce(new Error("Not found"));
    const actor = makeActor([], null);
    const mgr = new BeltSheetManager(actor);
    await mgr.setSlot(0, "Invalid.UUID.XYZ");
    expect(ui.notifications.error).toHaveBeenCalled();
  });

  test("warns when resolved item is null", async () => {
    global.fromUuid.mockResolvedValueOnce(null);
    const actor = makeActor([], null);
    const mgr = new BeltSheetManager(actor);
    await mgr.setSlot(0, "Item.null-item");
    expect(ui.notifications.warn).toHaveBeenCalled();
  });
});

// ─── BeltSheetManager - injectBeltUI ─────────────────────────────────────
describe("BeltSheetManager - injectBeltUI", () => {
  beforeEach(() => jest.clearAllMocks());

  /**
   * Build a minimal native-DOM-like root element mock.
   * querySelector returns the named anchor; insertAdjacentHTML is tracked.
   */
  const makeRoot = (anchorSel) => {
    const anchor = {
      insertAdjacentHTML: jest.fn()
    };
    // Simulate a container that does NOT yet exist (no prior injection)
    const querySelectorMap = {
      ".rnk-quick-chug-belt-container": null,  // not injected yet
      [anchorSel]: anchor
    };
    const root = {
      querySelector: jest.fn(sel => querySelectorMap[sel] ?? null),
      addEventListener: jest.fn()
    };
    // After injection, querySelector(".rnk-quick-chug-belt-container") returns container
    anchor.insertAdjacentHTML.mockImplementation(() => {
      querySelectorMap[".rnk-quick-chug-belt-container"] = {
        addEventListener: jest.fn()
      };
    });
    return { root, anchor };
  };

  test("injects after .top .encumbrance.card when present", async () => {
    const actor = makeActor();
    const mgr = new BeltSheetManager(actor);
    const { root, anchor } = makeRoot(".top .encumbrance.card");

    await mgr.injectBeltUI(root);

    expect(anchor.insertAdjacentHTML).toHaveBeenCalledWith("afterend", "<div>mock</div>");
  });

  test("falls back to .sheet-body when encumbrance card not found", async () => {
    const actor = makeActor();
    const mgr = new BeltSheetManager(actor);
    const { root, anchor } = makeRoot(".sheet-body");

    // Override querySelector to say encumbrance not found but sheet-body is
    root.querySelector.mockImplementation(sel => {
      if (sel === ".rnk-quick-chug-belt-container") return null;
      if (sel === ".top .encumbrance.card") return null;
      if (sel === ".sheet-body") return anchor;
      if (sel === ".rnk-quick-chug-belt-container") return { addEventListener: jest.fn() };
      return null;
    });
    anchor.insertAdjacentHTML.mockImplementation(() => {
      root.querySelector.mockImplementation(sel => {
        if (sel === ".rnk-quick-chug-belt-container") return { addEventListener: jest.fn() };
        return null;
      });
    });

    await mgr.injectBeltUI(root);

    expect(anchor.insertAdjacentHTML).toHaveBeenCalledWith("afterend", "<div>mock</div>");
  });

  test("does not inject twice (guard against double render)", async () => {
    const actor = makeActor();
    const mgr = new BeltSheetManager(actor);
    const { root } = makeRoot(".top .encumbrance.card");

    // Simulate already-injected container present in DOM
    root.querySelector.mockReturnValue({ addEventListener: jest.fn(), insertAdjacentHTML: jest.fn() });

    await mgr.injectBeltUI(root);

    // renderTemplate should NOT have been called since guard fires first
    expect(global.renderTemplate).not.toHaveBeenCalled();
  });

  test("warns and aborts when no anchor found", async () => {
    const actor = makeActor();
    const mgr = new BeltSheetManager(actor);
    const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    const root = {
      querySelector: jest.fn(() => null),
      addEventListener: jest.fn()
    };

    await mgr.injectBeltUI(root);

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining("No injection anchor found")
    );
    warnSpy.mockRestore();
  });
});


