import { html } from "lit";
import { Page } from "../../Page.js";

import { UnsafeComponent } from '../../Unsafe.js'


export class GuidedStubPreviewPage extends Page {
    constructor(...args) {
        super(...args);
    }

    footer = {
        next: "Run Conversion",
        onNext: async () => {
            this.save(); // Save in case the conversion fails

            delete this.info.globalState.conversion;
            this.info.globalState.conversion = await this.runConversions({}, true, {
                title: "Running all conversions",
            });
            this.onTransition(1);
        },
    };

    render() {
        return html`
            <div>
                ${this.info.globalState.preview
                    ? this.info.globalState.preview.map(
                          (o) =>
                              html`<h2 class="guided--text-sub-step">${o.file}</h2>
                                  ${new UnsafeComponent(o.html)}`
                      )
                    : html`<p style="text-align: center;">Your conversion preview failed. Please try again.</p>`}
            </div>
        `;
    }
}

customElements.get("nwbguide-guided-stub-review-page") ||
    customElements.define("nwbguide-guided-stub-review-page", GuidedStubPreviewPage);
