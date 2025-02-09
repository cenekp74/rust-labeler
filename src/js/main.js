const { invoke } = window.__TAURI__.core;
const { open } = window.__TAURI__.dialog;

async function loadSettings() {
    settings = await invoke("load_settings");
    return settings
}

async function saveSettings(settings) {
    await invoke("save_settings", {settings});
}

async function getImage(image_filename) {
    image = await invoke("get_image", {"imagePath":window.settings.input_path+"/"+image_filename})
    return image
}

async function getImageFilenames() {
    filenames = await invoke("get_image_filenames", {"inputPath":window.settings.input_path});
    return filenames
}

async function getOutput() {
    output = await invoke("get_output", {"inputPath":window.settings.input_path, "outputFileName": window.settings.output_file_name})
    return output
}

async function addToOutput(imageFilename, category) {
    await invoke("add_to_output", {
        "inputPath":window.settings.input_path, "outputFileName": window.settings.output_file_name,
        "imageFilename":imageFilename, "category":category
    })
    window.output = await getOutput()
}

function displayImage(image_filename) {
    getImage(image_filename).then((img) => {
        document.getElementById("main-image").setAttribute("src", img)
    })
}

function changeActiveImage(image_filename) {
    window.activeImage = image_filename
    displayImage(image_filename)
    document.querySelectorAll(".dot").forEach((ele) => {
        ele.classList.remove("active")
    })
    dotEle = document.querySelector(`.dot[data-filename='${image_filename}']`)
    dotEle.classList.add("active")
    document.getElementById("active-image-name").innerText = image_filename
    reloadActiveCategory()
}

function reloadActiveCategory() {
    document.querySelectorAll(".category-button").forEach(ele => {
        category = ele.getAttribute("data-category")
        if (window.output && window.activeImage) {
            if (window.output[window.activeImage] == category) {
                ele.classList.add("active")
            } else {
                ele.classList.remove("active")
            }
        }
    });

    if (window.output && window.activeImage) {
        if (window.output[window.activeImage]) {
            document.getElementById("active-image-name").innerText = `${window.activeImage} - labeled "${window.output[window.activeImage]}"`
        } else {
            document.getElementById("active-image-name").innerText = `${window.activeImage} - not labeled`
        }
    }
}

function reloadCategories() {
    const container = document.getElementById("categories")
    container.innerHTML = ""
    i = 0
    let categories = window.settings.categories[window.settings.input_path] // if there are categories for this input path, use those
    if (!categories) {
        categories = window.settings.categories[Object.keys(window.settings.categories)[Object.keys(window.settings.categories).length-1]] // else use the last used categories
    }
    if (!categories) {
        categories = []
    }
    window.settings.categories[window.settings.input_path] = categories
    saveSettings(window.settings)
    categories.forEach((category) => {
        i++
        ele = document.createElement("div")
        ele.classList.add("category-button")
        ele.innerText = category + ` (${i})`
        container.appendChild(ele)
        ele.addEventListener("click", () => {
            labelActiveImage(category)
        })
        ele.setAttribute("data-key", i)
        ele.setAttribute("data-category", category)
        document.addEventListener("keypress", (e) => {
            document.querySelectorAll(".category-button").forEach((buttonEle) => {
                key = buttonEle.getAttribute("data-key")
                if (key==e.key) {
                    labelActiveImage(buttonEle.getAttribute("data-category"))
                }
            })
        })
    })
    reloadActiveCategory()
}

function labelActiveImage(category) {
    if (!(window.activeImage)) return
    addToOutput(window.activeImage, category).then(() => {
        reloadImageDots(window.filenames)
        reloadActiveCategory()
    })
}

function reloadImageDots(filenames) {
    const container = document.getElementById("images-nav")
    container.innerHTML = ""
    filenames.forEach(filename => {
        ele = document.createElement("div")
        ele.appendChild(document.createElement("abbr"))
        ele.querySelector("abbr").setAttribute("title", filename)
        ele.classList.add("dot")
        ele.setAttribute("data-filename", filename)
        container.appendChild(ele)
        ele.addEventListener("click", () => {
            changeActiveImage(filename)
        })
        if (window.output[filename]) {
            ele.classList.add("labeled")
        }
        if (window.activeImage == filename) {
            ele.classList.add("active")
        }
    });
}

async function changeInputPath() {
    path = await open({
        multiple: false,
        directory: true,
    })
    window.settings.input_path = path
    saveSettings(window.settings)
    main()
}

/** function for processing click on "add new category" button in categories edit window */
function addNewCategory() {
    window.settings.categories[window.settings.input_path].push("changeme")
    reloadCategories()
    showEditCategoriesWindow()
    saveSettings()
}

/** function for loading/reloading the edit categories window */
function showEditCategoriesWindow() {
    document.getElementById("edit-categories-for-text").innerText = `*for ${window.settings.input_path}`
    const container = document.querySelector("#edit-categories #categories-inputs")
    container.innerHTML = ""
    i = 0
    window.settings.categories[window.settings.input_path].forEach((category) => {
        ele = document.createElement("div")
        inputEle = document.createElement("input")
        inputEle.value = category
        inputEle.setAttribute("data-category-index", i)
        trashEle = document.createElement("div")
        trashEle.classList.add("trash-icon")
        trashEle.setAttribute("data-category-index", i)

        trashEle.addEventListener("click", (e) => {
            categoryIndex = e.target.getAttribute("data-category-index")
            window.settings.categories[window.settings.input_path].splice(categoryIndex, 1)
            reloadCategories()
            showEditCategoriesWindow()
            saveSettings()
        })

        ele.appendChild(inputEle)
        ele.appendChild(trashEle)

        inputEle.addEventListener("change", (e) => {
            categoryIndex = e.target.getAttribute("data-category-index")
            newCategory = e.target.value
            window.settings.categories[window.settings.input_path][categoryIndex] = newCategory
            reloadCategories()
            saveSettings()
        })

        container.appendChild(ele)
        i++
    })
    document.getElementById("edit-categories").classList.add("active")
}

function main() {
    window.output = getOutput()
    getImageFilenames().then((filenames) => {
        window.filenames = filenames
        reloadImageDots(filenames)
        changeActiveImage(filenames[0])
        reloadCategories()
    })
}

window.addEventListener("DOMContentLoaded", () => {
    loadSettings().then((settings) => {
        window.settings = settings
        main()
    })
});

document.getElementById("input-path-button").addEventListener("click", changeInputPath)

document.getElementById("edit-categories-button").addEventListener("click", () => {
    showEditCategoriesWindow()
})

document.getElementById("close-edit-categories-buton").addEventListener("click", () => {
    document.getElementById("edit-categories").classList.remove("active")
})

document.getElementById("edit-categories").addEventListener("keypress", (e) => {e.stopPropagation()}) // this is to stop labeling images when pressing keys in edit categories window

document.getElementById("add-new-category-button").addEventListener("click", addNewCategory)