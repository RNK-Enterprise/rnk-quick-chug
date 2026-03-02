/**
 * RNK Quick Chug - Primary Engine
 * Version: 1.0.0
 * Status: Production Ready
 */

import { MODULE_ID } from "./constants.js";
import { BeltSheetManager } from "./apps/belt-sheet-manager.js";
import { QuickChugApp } from "./apps/quick-chug-app.js";
import { registerArgonIntegration } from "./apps/argon-integration.js";

export { MODULE_ID } from "./constants.js";
export { BELT_SLOTS } from "./constants.js";

/**
 * RNK Engine for Quick Chug
 */
class QuickChugEngine {
  static init() {
    this._appInstance = null;
    this._registerSettings();
    this.log("Engine Initialized");
  }

  static async toggleApp() {
    if (this._appInstance?.rendered) {
      return this._appInstance.close();
    }

    if (!this._appInstance) {
      this._appInstance = new QuickChugApp();
    }

    return this._appInstance.render({ force: true });
  }

  static _registerSettings() {
    game.settings.register(MODULE_ID, "enableArgon", {
      name: game.i18n.localize("rnk-quick-chug.settings.enableArgon.name"),
      hint: game.i18n.localize("rnk-quick-chug.settings.enableArgon.hint"),
      scope: "world",
      config: true,
      type: Boolean,
      default: true
    });

    game.settings.register(MODULE_ID, "debugMode", {
      name: game.i18n.localize("rnk-quick-chug.settings.debugMode.name"),
      hint: game.i18n.localize("rnk-quick-chug.settings.debugMode.hint"),
      scope: "client",
      config: true,
      type: Boolean,
      default: false
    });
  }

  static log(msg, data = null) {
    const prefix = `[${MODULE_ID}]`;
    if (data) console.log(prefix, msg, data);
    else console.log(prefix, msg);
  }

  static warn(msg) {
    console.warn(`[${MODULE_ID}]`, msg);
  }
}

// Hooks Interface
Hooks.once("init", () => {
  QuickChugEngine.init();
  if (game.modules.get("enhancedcombathud")?.active) registerArgonIntegration();
});

Hooks.on("getSceneControlButtons", (controls) => {
    const tool = {
      name: "qc-belt-open",
      title: "RNK Quick Chug",
      icon: "fas fa-flask",
      button: true,
      toggle: false,
      onChange: (active) => {
        if (!active) return;
        QuickChugEngine.toggleApp();
      }
    };

    // v13: controls is a plain object keyed by layer name
    if (controls?.tokens?.tools) {
      controls.tokens.tools["qc-belt-open"] = tool;
    } else if (Array.isArray(controls)) {
      // legacy array fallback
      const toolId = "qc-belt-open";
      controls.push({
        name: "rnk-quick-chug",
        title: "RNK Quick Chug",
        icon: "fas fa-flask",
        order: 100,
        layer: "tokens",
        visible: true,
        tools: { [toolId]: tool }
      });
    }
  });

Hooks.on("renderApplicationV2", (app, html) => {
  const actor = app.actor ?? app.document;
  if (!actor || actor.documentName !== "Actor") return;
  const manager = new BeltSheetManager(actor);
  manager.injectBeltUI(html);
});

// Global API
globalThis.QC_ENGINE = QuickChugEngine;
