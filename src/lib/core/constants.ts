export const moduleType = {
    FILE: "File",
    FOLDER: "Folder",
    UPLOAD: "Upload",
} as const

export type ModuleType = (typeof moduleType)[keyof typeof moduleType]

export const fileType = {
    MARKDOWN: "Markdown",
    PDF: "PDF",
    OTHERS: "Others"
}

export const OPEN_CREATE_MODULE_DIALOG_EVENT = "vault:open-create-module-dialog"

export type CreateModuleEventDetail = {
    /** Slug path of the folder to create inside. Defaults to the current route's folder. */
    targetSlugPath?: string[]
    /** Display name of the target folder for the dialog subtitle. */
    targetName?: string
    type?: ModuleType
}

export const openCreateDialog = (detail: CreateModuleEventDetail = {}) => {
    window.dispatchEvent(new CustomEvent<CreateModuleEventDetail>(OPEN_CREATE_MODULE_DIALOG_EVENT, { detail }))
}

export const OPEN_COMMAND_PALETTE_EVENT = "vault:open-command-palette"

export const openCommandPalette = () => {
    window.dispatchEvent(new Event(OPEN_COMMAND_PALETTE_EVENT))
}
