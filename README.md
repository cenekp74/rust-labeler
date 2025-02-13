# rust-labeler

A simple app made with tauri in rust for labeling images. 

For cases when you need to simply sort images into categories, nothing else. 
## How to compile
You can clone the repo and run `cargo tauri build` to compile this project. 

## Usage
To start, click "Open" in top left corner and select a folder with your images. Then you need to create some categories by clicking on "Edit categories". The categories are stored separately for each folder of images. 

After selecting a folder and creating categories, you can label an image either by clicking on one of the buttons on the bottom, or by pressing a key (the key for each category is displayed in parenthesis). To return to the previous image, press "0".  After labeling an image, you will automatically jump to the next one. You can track your progress by status bar above the image. By clicking on the dots representing images, you can jump to another image. Hover over the dot to see the image filename. 

To edit settings manually, you can click on "Settings" button at the top. It will open `settings.json` in default text editor. 

### Output
The labels are stored in `rust-labeler.json` (this can be changed in `settings.json`). 

## Screenshots
![image](https://github.com/user-attachments/assets/e04f2417-ed3d-476c-a696-5f8481de1133)

![image](https://github.com/user-attachments/assets/5dc13d89-6199-47b5-aa52-30845865fdf8)
