const searchBar = document.getElementById('searchBar');
const cards = document.getElementsByClassName('card');

// hide search bar if no cards on page
window.onload = function () {
    let cards = document.getElementsByClassName('card');
    if (cards.length > 0) {
        document.getElementById('searchBox').style.display = '';
    }
};

searchBar.addEventListener('keyup', (e) => {
    const searchString = e.target.value.toLowerCase().trim();
    for (let i = 0; i < cards.length; i++) {
        let name = document.getElementsByClassName('card')[i].childNodes[1].childNodes[3].childNodes[1].innerText.toLowerCase();
        if (name.includes(searchString)) {
            document.getElementsByClassName('card')[i].style.display = "block";
        } else {
            document.getElementsByClassName('card')[i].style.display = "none";
        }
    }
});