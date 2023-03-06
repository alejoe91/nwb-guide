from neuroconv.datainterfaces import SpikeGLXRecordingInterface, PhySortingInterface


def get_all_interface_info() -> dict:
    """Format an information structure to be used for selecting interfaces based on modality and technique."""
    # Hard coded for now - eventual goal will be to import this from NeuroConv
    interfaces_by_modality_and_technique = dict(
        ecephys=dict(
            recording=dict(SpikeGLX=SpikeGLXRecordingInterface),
            sorting=dict(Phy=PhySortingInterface),
        )
    )

    interface_info = dict()

    for modality, techniques in interfaces_by_modality_and_technique.items():
        for technique, format_name_to_interface in techniques.items():
            for format_name, interface in format_name_to_interface.items():
                interface = format_name_to_interface
                interface_info[format_name] = {  # Note in the full scope, format_name won't be unique
                    "tags": [modality, technique],
                    "name": interface.__name__,  # Where is this value used in the display?
                    "category": technique,  # Is this actually necessary anymore?
                }

    return interface_info
