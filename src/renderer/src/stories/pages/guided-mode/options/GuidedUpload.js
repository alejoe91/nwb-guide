import { html } from "lit";
import { JSONSchemaForm } from "../../../JSONSchemaForm.js";
import { Page } from "../../Page.js";
import { onThrow } from "../../../../errors";
import { merge } from "../../utils.js";
import Swal from "sweetalert2";
import dandiUploadSchema from "../../../../../../../schemas/dandi-upload.schema";
import { createDandiset, uploadToDandi } from "../../uploads/UploadsPage.js";
import { until } from "lit/directives/until.js";

import { Button } from "../../../Button.js";

import dandiSVG from "../../../assets/dandi.svg?raw";

import { baseUrl, onServerOpen } from "../../../../server/globals";

export class GuidedUploadPage extends Page {
    constructor(...args) {
        super(...args);
    }

    form;

    beforeSave = () => {
        const globalState = this.info.globalState;
        const isNewDandiset = globalState.upload?.dandiset !== this.localState.dandiset;
        merge({ upload: this.localState }, globalState); // Merge the local and global states
        if (isNewDandiset) delete globalState.upload.results; // Clear the preview results entirely if a new Dandiset
    };

    header = {
        subtitle: "Settings to upload your conversion to the DANDI Archive",
        controls: [
            new Button({
                icon: dandiSVG,
                label: "Create Dandiset",
                onClick: async () => await createDandiset.call(this), // Will throw an error if not created
            }),
        ],
    };

    footer = {
        next: "Upload Project",
        onNext: async () => {
            await this.save(); // Save in case the conversion fails

            await this.form.validate(); // Will throw an error in the callback

            const globalState = this.info.globalState;
            const globalUploadInfo = globalState.upload;

            // Catch if Dandiset is already uploaded
            if ("results" in globalUploadInfo) {
                const result = await Swal.fire({
                    title: "This pipeline has already uploaded to DANDI",
                    html: "Would you like to reupload the lastest files?",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#3085d6",
                    confirmButtonText: "Continue with Reupload",
                    cancelButtonText: "Skip Upload",
                });

                if (!result || !result.isConfirmed) return this.to(1);
            }

            globalUploadInfo.results = await uploadToDandi.call(this, {
                ...globalUploadInfo.info,
                project: globalState.project.name,
            });

            this.to(1);
        },
    };

    render() {
        const state = (this.localState = structuredClone(this.info.globalState.upload ?? { info: {} }));

        const promise = onServerOpen(async () => {
            await fetch(new URL("cpus", baseUrl))
            .then((res) => res.json())
            .then(({ physical, logical }) => {
                const { number_of_jobs, number_of_threads } = dandiUploadSchema.properties.additional_settings.properties;
                number_of_jobs.max = number_of_jobs.default = physical;
                number_of_threads.max = number_of_threads.default = logical / physical;
            })
            .catch(() => {});

            return (this.form = new JSONSchemaForm({
                schema: dandiUploadSchema,
                results: state.info,
                onUpdate: () => (this.unsavedUpdates = true),
                onThrow,
            }));
        });

        return html`${until(promise, html`Loading form contents...`)} `;
    }
}

customElements.get("nwbguide-guided-upload-page") ||
    customElements.define("nwbguide-guided-upload-page", GuidedUploadPage);