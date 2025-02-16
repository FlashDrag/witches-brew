let cauldronContents = [];
let potions;
let ingredients;

import showRecipeBook from "./recipe_book.js";
import { createInventory, resetInventory, getInventory, addToInventory, removeFromInventory } from "./inventory.js";
import { isAudioOn } from "./audio.js";

// standart drag and drop functions
const draggableConfig = {
    onstart: function (event) {

    },
    onmove: function (event) {
        var target = event.target;
        var x = (parseFloat(target.getAttribute('data-x')) || 0) + event.dx;
        var y = (parseFloat(target.getAttribute('data-y')) || 0) + event.dy;

        target.style.transform = 'translate(' + x + 'px, ' + y + 'px)';
        target.setAttribute('data-x', x);
        target.setAttribute('data-y', y);
    },
    onend: function (event) {
        resetElementPosition(event.target);
    },
};

document.addEventListener("DOMContentLoaded", function () {
    const ingredientElements = document.querySelectorAll('.ingredient');

    // parse json file
    fetch('assets/json/components_data.json')
        .then((response) => response.json())
        .then((json) => {

            const componentsData = json;
            potions = componentsData.potions;
            ingredients = componentsData.ingredients;

            for (let i = 0; i < ingredientElements.length; i++) {
                ingredientElements[i].style.backgroundImage = `url('${ingredients[i].picture}')`;
                // set the ingredient's name as a data attribute
                ingredientElements[i].setAttribute('data-name', ingredients[i].name);
            }
            checkLocalStorage()
            createIngredientInventory();
    });

    document.querySelector('.cauldron').addEventListener('click', function () {
        brewPotion(potions, cauldronContents);
    });

    document.querySelector('#recipie-book-img-container').addEventListener('click', function () {
        showRecipeBook();
    });

    // for (let i = 0; i < ingredientElements.length; i++) {
    //     ingredientElements[i].addEventListener('mouseover', function () {
    //         gsap.to(ingredientElements[i], {duration: 0.2, scale: 1.1});
    //     });
    //     ingredientElements[i].addEventListener('mouseout', function () {
    //         gsap.to(ingredientElements[i], {duration: 0.2, scale: 1});
    //     });
    // }

    makeIngredientsDraggable();

    interact('.cauldron').dropzone({
        accept: '.ingredient',
        ondragenter: function (event) {
            const ingredient = event.relatedTarget;
            ingredient.classList.add('cauldron-hover');
        },
        ondragleave: function (event) {
            const ingredient = event.relatedTarget;
            ingredient.classList.remove('cauldron-hover');
        },
        ondrop: function (event) {
            const ingredient = event.relatedTarget;
            ingredient.classList.remove('cauldron-hover');

            // Add the ingredient to the cauldron
            const ingredientName = ingredient.getAttribute('data-name');
            if (cauldronContents.length < 4){
                cauldronContents.push(ingredient.firstElementChild.getAttribute('alt'));
                // get ingredient child element
                updateContentList(ingredient.firstElementChild.getAttribute('alt'), ingredient.firstElementChild.getAttribute('src'));
            } else if (cauldronContents.length === 4) {
                cauldronContents.push(ingredient.firstElementChild.getAttribute('alt'));
                updateContentList(ingredient.firstElementChild.getAttribute('alt'), ingredient.firstElementChild.getAttribute('src'));
                // append greyscaled-image class to all ingredients
                const ingredientsInventory = document.querySelectorAll('.ingredient');
                for (let i = 0; i < ingredientsInventory.length; i++) {
                    ingredientsInventory[i].classList.add('greyscaled-image');
                }
                // make ingredients not draggable
                makeIngredientsNotDraggable();

            }

            resetElementPosition(ingredient);
        },
    });

});

function checkLocalStorage() {
    if (localStorage.getItem("potions") !== null) {
        let discoveredPotions = JSON.parse(localStorage.getItem("potions"));
        potions = discoveredPotions;
    }
    // if local storage is empty, set all potions to undiscovered and save to local storage
    else {
        for (let i = 0; i < potions.length; i++) {
            potions[i].discovered = false;
        }
        localStorage.setItem("potions", JSON.stringify(potions));
    }
}

function makeIngredientsDraggable() {
    interact('.ingredient').draggable(draggableConfig);
}

function makeIngredientsNotDraggable() {
    interact('.ingredient').unset();
}

function resetElementPosition(element) {
    element.style.transform = 'translate(0px, 0px)';
    element.setAttribute('data-x', 0);
    element.setAttribute('data-y', 0);
}

function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) {
      return false;
    }

    // Sort the arrays
    const sortedArr1 = arr1.slice().sort();
    const sortedArr2 = arr2.slice().sort();

    for (let i = 0; i < sortedArr1.length; i++) {
      if (sortedArr1[i] !== sortedArr2[i]) {
        return false;
      }
    }

    return true;
}

const dropdownAlert = document.querySelector('.dropdown-alert');
const dropdownAlertText = document.querySelector('.dropdown-alert-text');


function brewPotion(potions, cauldronContents) {
    if (isAudioOn()) {
        playBrewingSound();
    }

    makeIngredientsNotDraggable();

    // change the cauldron gif to cauldron-brew.gif
    const cauldron = document.querySelector('.cauldron');
    document.querySelector('#couldron-img').setAttribute('src', 'assets/images/general/cauldron_brew.gif')
    // wait 3 seconds
    setTimeout(function () {
        // change the cauldron gif to cauldron.gif
        document.querySelector('#couldron-img').setAttribute('src', 'assets/images/general/cauldron.gif')
    }, 2500);

    for(let potion of potions) {

        if(arraysEqual(potion.ingredients, cauldronContents)) {
            let potionsBrewed = JSON.parse(localStorage.getItem("potionsBrewed"));
            if (!potionsBrewed) {
                localStorage.setItem("potionsBrewed", JSON.stringify(0))
                potionsBrewed = 0;
            }
            potionsBrewed += 1;
            localStorage.setItem("potionsBrewed", JSON.stringify(potionsBrewed))
            const potionsInInventory = getInventory().length;
            dropdownAlertText.innerHTML = ` (${potionsBrewed}/10) You brewed: `;
            const potionImg = document.createElement('img');
            potionImg.classList.add('dropdown-alert-img');
            potionImg.setAttribute('src', `${potion.picture}`)
            potionImg.style.width = '1.5rem';
            potionImg.style.objectFit = 'fill';
            dropdownAlertText.appendChild(potionImg);

            // make the dropdown alert visible for 3 seconds, animate opacity using gsap
            gsap.to(dropdownAlert, {duration: 0.5, opacity: 1});
            setTimeout(function () {
                gsap.to(dropdownAlert, {duration: 0.5, opacity: 0});
            }
            , 1000);

            resetContentList(cauldronContents);

            if (potionsBrewed < 10) {
                addToInventory(potion);
            } else {
                dropdownAlertText.innerHTML = 'Inventory full';
                gsap.to(dropdownAlert, {duration: 0.5, opacity: 1});
                setTimeout(function () {
                    gsap.to(dropdownAlert, {duration: 0.5, opacity: 0});
                }
                , 1000);
            }
            return;
        }

    }
    // make the dropdown alert visible for 3 seconds, animate opacity using gsap, set text to "No potion found"
    dropdownAlertText.innerHTML = 'No potion found';
    gsap.to(dropdownAlert, {duration: 0.5, opacity: 1});
    setTimeout(function () {
        gsap.to(dropdownAlert, {duration: 0.5, opacity: 0});
    }
    , 1000);
    resetContentList(cauldronContents);
}

function updateContentList(ingredientName, ingredientImage) {

    let parent = document.createElement("div");
    let pictureFrame = document.createElement("div");
    let ingredient = document.createElement("img");
    let text = document.createElement("p");

    ingredient.setAttribute("src", ingredientImage);
    ingredient.setAttribute("alt", ingredientName);
    parent.classList.add("ingredient-for-recipie");
    ingredient.classList.add("ingredient-img", "dragable");
    pictureFrame.appendChild(ingredient);

    text.innerHTML = ingredientName;

    parent.appendChild(pictureFrame);
    parent.appendChild(text);

    document.querySelector('.content-list').appendChild(parent);
}

function resetContentList(cauldronContents) {
    const contentList = document.querySelector('.content-list');
    contentList.innerHTML = '';
    cauldronContents.length = 0;
    // remove greyscaled-image class from all ingredients
    const ingredientsInventory = document.querySelectorAll('.ingredient');
    for (let i = 0; i < ingredientsInventory.length; i++) {
        ingredientsInventory[i].classList.remove('greyscaled-image');
    }
    makeIngredientsDraggable();
}

function addDiscoveredPotion(potionID) {
// Get the array of potions from local storage

    const potions = JSON.parse(localStorage.getItem('potions')) || [];

    if (potionID >= 0 && potionID < potions.length ) {
        // If the potion is found, set its "discovered" attribute to true
        potions[potionID].discovered = true;

        // Update the potions array in local storage
        localStorage.setItem('potions', JSON.stringify(potions));
    } else {
        console.log(`Potion with ID ${potionID} was not found.`);
    }
}

function addToIngredienstListHTML() {
    const ingredientsInventory = document.getElementById("recipie-ingredients");
    ingredientsInventory.innerHTML = "";

    // loop through brewed potions and add them to the potions inventory
    for (let i = 0; i < 5; i++) {
        let parent = document.createElement("div");
        let pictureFrame = document.createElement("div");
        let ingredient = document.createElement("img");
        let text = document.createElement("p");

        ingredient.setAttribute("src", ingredients[i].picture);
        ingredient.setAttribute("alt", ingredients[i].name);
        ingredient.classList.add("ingredient-img", "dragable");
        pictureFrame.appendChild(ingredient);

        parent.setAttribute("id", "ingredient-" + i);
        parent.classList.add("ingredient-for-recipie");
        parent.setAttribute("data-ingredient-id", i);
        parent.setAttribute("data-item", "ingredient");

        text.innerHTML = ingredients[i].name;

        parent.appendChild(pictureFrame);
        parent.appendChild(text);

        ingredientsInventory.appendChild(parent);
    }
}

function createIngredientInventory() {
    const ingredientsInventory = document.getElementById("ingredients-list");
    ingredientsInventory.innerHTML = "";

    // loop through brewed potions and add them to the potions inventory
    for (let i = 0; i < ingredients.length; i++) {
        let parent = document.createElement("div");
        parent.classList.add("ingredient");
        let ingredient = document.createElement("img");

        ingredient.setAttribute("src", ingredients[i].picture);
        ingredient.setAttribute("alt", ingredients[i].name);
        ingredient.classList.add("ingredient-img", "dragable");

        parent.setAttribute("id", "ingredient-" + i);
        parent.classList.add("ingredient-container");
        parent.setAttribute("data-ingredient-id", i);
        parent.setAttribute("data-item", "ingredient");
        parent.setAttribute("data-ingredient-ammount", 0);

        // tooltip
        parent.setAttribute("data-bs-toggle", "tooltip");
        parent.setAttribute("data-bs-placement", "top");
        parent.setAttribute("data-bs-title", ingredients[i].name);

        parent.appendChild(ingredient);

        ingredientsInventory.appendChild(parent);
    }
}

function playBrewingSound() {
    const audio = new Audio('assets/sounds/bubbling.wav');
    audio.play();
    setTimeout(function () {
        audio.pause();
    }, 2500);
}