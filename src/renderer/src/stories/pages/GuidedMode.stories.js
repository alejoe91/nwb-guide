import { dashboard } from "../../pages.js";
import nwbBaseSchema from "../../../../../schemas/base-metadata.schema";
import exephysExampleSchema from "../../../../../schemas/json/ecephys_metadata_schema_example.json";

const options = Object.keys(dashboard.pagesById).filter((k) => k.includes("conversion"));

export default {
    title: "Pages/Guided Mode",
    parameters: {
        chromatic: { disableSnapshot: false },
    },
    argTypes: {
        activePage: {
            options,
            control: { type: "select" },
        },
    },
};

nwbBaseSchema.properties.Ecephys = exephysExampleSchema;

const globalState = {
    project: {
        name: "test",
        NWBFile: {
            lab: "My Lab",
        },
        Subject: {
            species: "Mus musculus",
        },
    },
    subjects: {
        subject_id: {},
    },
    results: {
        subject_id: {
            session_id: {
                metadata: {},
                source_data: {},
            },
        },
    },
    interfaces: {
        neuropixel: "SpikeGLXRecordingInterface",
    },
    schema: {
        source_data: {
            properties: {
                neuropixel: {
                    type: "object",
                    properties: {
                        file_path: {
                            type: "string",
                            description: "Enter the path to the source data file.",
                            format: "file",
                        },
                    },
                    required: ["file_path"],
                },
            },
        },
        metadata: {
            subject_id: {
                session_id: nwbBaseSchema,
            },
        },
    },
};

const Template = (args = {}) => {
    for (let k in args) dashboard[k] = args[k];
    return dashboard;
};

export const Home = Template.bind({});
Home.args = {
    activePage: "conversion",
};

export const Start = Template.bind({});
Start.args = {
    activePage: "conversion/start",
};

export const NewDataset = Template.bind({});
NewDataset.args = {
    activePage: "conversion/details",
};

export const Structure = Template.bind({});
Structure.args = {
    activePage: "conversion/structure",
};

export const Locate = Template.bind({});
Locate.args = {
    activePage: "conversion/locate",
};

export const Subjects = Template.bind({});
Subjects.args = {
    activePage: "conversion/subjects",
};

export const SourceData = Template.bind({});
SourceData.args = {
    activePage: "conversion/sourcedata",
};

export const Metadata = Template.bind({});
Metadata.args = {
    activePage: "conversion/metadata",
};

export const ConversionOptions = Template.bind({});
ConversionOptions.args = {
    activePage: "conversion/options",
};

export const StubPreview = Template.bind({});
StubPreview.args = {
    activePage: "conversion/preview",
};

export const Upload = Template.bind({});
Upload.args = {
    activePage: "conversion/upload",
};

export const Results = Template.bind({});
Results.args = {
    activePage: "conversion/review",
};

const statefulPages = [
    Home,
    Start,
    NewDataset,
    Structure,
    Locate,
    Subjects,
    SourceData,
    Metadata,
    ConversionOptions,
    StubPreview,
    Upload,
    Results,
];

statefulPages.forEach((page) => (page.args.globalState = globalState));
