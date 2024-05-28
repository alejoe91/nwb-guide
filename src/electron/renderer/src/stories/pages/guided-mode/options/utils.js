import Swal from "sweetalert2";
import { sanitize } from "../../utils";
import { baseUrl } from "../../../../server/globals";

export const openProgressSwal = (options, callback) => {
    return new Promise((resolve) => {
        Swal.fire({
            title: "Requesting data from server",
            allowEscapeKey: false,
            allowOutsideClick: false,
            showConfirmButton: false,
            heightAuto: false,
            backdrop: "rgba(0,0,0, 0.4)",
            timerProgressBar: false,
            didOpen: () => {
                Swal.showLoading();
                resolve(Swal);
            },
            ...options,
        }).then((result) => callback?.(result));
    });
};

export const run = async (pathname, payload, options = {}) => {
    let internalSwal;

    if (options.swal === false) {
    } else if (!options.swal || options.swal === true) {
        if (!("showCancelButton" in options)) {
            options.showCancelButton = true;
            options.customClass = { actions: "swal-conversion-actions" };
        }

        const cancelController = new AbortController();

        options.fetch = {
            signal: cancelController.signal,
        };

        const popup = (internalSwal = await openProgressSwal(options, (result) => {
            if (!result.isConfirmed) cancelController.abort();
        }).then(async (swal) => {
            if (options.onOpen) await options.onOpen(swal);
            return swal;
        }));

        const element = popup.getHtmlContainer();

        const actions = popup.getActions();
        const loader = actions.querySelector(".swal2-loader");
        const container = document.createElement("div");
        container.append(loader);

        const notDisplayed = element.style.display === "none";

        Object.assign(element.style, {
            marginTop: notDisplayed ? "" : "0",
            display: "unset",
        });

        Object.assign(container.style, {
            marginTop: notDisplayed ? "" : "25px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "25px",
        });

        element.appendChild(container);

        element.insertAdjacentHTML("beforeend", `<hr style="margin-bottom: 0;">`);
    }

    // Clear private keys from being passed
    payload = sanitize(structuredClone(payload));

    const results = await fetch(new URL(pathname, baseUrl), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        ...(options.fetch ?? {}),
    })
        .then(async (res) => {
            const json = await res.json();
            if (!res.ok) {
                const message = json.message;
                const header = `<h4 style="margin: 0;">Request to ${pathname} failed</h4><small>${json.type}</small>`;
                const text = message.replaceAll("<", "&lt").replaceAll(">", "&gt").trim();
                throw new Error(`${header}<p>${text}</p>`);
            }
            return json;
        })
        .finally(() => {
            if (internalSwal) Swal.close();
        });

    return results || true;
};

export const runConversion = async (info, options = {}) =>
    run(`neuroconv/convert`, info, {
        title: "Running the conversion",
        onError: (results) => {
            if (results.message.includes("already exists")) {
                return "File already exists. Please specify another location to store the conversion results";
            } else {
                return "Conversion failed with current metadata. Please try again.";
            }
        },
        ...options,
    });
