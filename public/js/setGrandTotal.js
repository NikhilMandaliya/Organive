const array = document.getElementsByClassName("total");
let grandTotal = 0;
for (let i = 0; i < array.length; i++) {
    let a = array[i].innerText.split(" ")[1];
    grandTotal = grandTotal + parseFloat(a);
}
document.getElementById("grandTotal").innerHTML = `&#8377; ${grandTotal}`;