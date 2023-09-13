import { html } from "lit";
import { Page } from "../../Page.js";

import { DandiResults } from "../../../DandiResults.js";

export class GuidedResultsPage extends Page {
    constructor(...args) {
        super(...args);
    }

    render() {
        const { conversion } = this.info.globalState.conversion;

        if (!conversion)
            return html`<div style="text-align: center;"><p>Your conversion failed. Please try again.</p></div>`;

        const { dandiset_id } = this.info.globalState.upload?.info ?? {};

        return DandiResults({ id: dandiset_id, files: conversion });
    }
}

customElements.get("nwbguide-guided-results-page") ||
    customElements.define("nwbguide-guided-results-page", GuidedResultsPage);
