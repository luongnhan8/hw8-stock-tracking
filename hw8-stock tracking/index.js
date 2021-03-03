let d_table;    // details table
let h_table;    // history table
let s_table;    // summary table
let b_table;    // buy table

// initialize arrays, market values not calculated !!!!!
let tradeArray = [];     // stockObject
let historyArray = [];   // stockObject
let buyArray = [];       // stockObject
let summaryArray = [];   // netValueObject

let netGain = 0;         // set in UpdateGainLoss(), used in BuildSummaryArray()
let origBuyCost = 0;
let gainLoss;
let returnPage;

// --------------------- declare stock object ------------------------//

let stockObject = function (pSymbol, pQuantity, pPrice, pBuySell, pDate, pGainLoss) {
    this.symbol = pSymbol;
    this.quantity = pQuantity;
    this.price = pPrice;
    // this.value  = pValue;  //add in DisplayHistoryTable
    this.buySell = pBuySell;
    this.date = pDate;
    this.gainLoss = pGainLoss;
}

// declare net object
let netValueObject = function (pSymbol, pQuantity, pCost, pValue) {
    this.symbol = pSymbol;
    this.quantity = pQuantity;
    this.cost  = pCost;
    this.value = pValue;
}
// ----------------- end declare stock object ------------------------//



// ------------------- Building tables --------------------------------//

// BUild history table or details table
function BuildHistoryDetailsTable(table, array) {   
    let rowCount = table.rows.length;
    // clear all data rows from the table
    while (rowCount > 1 ) {
        table.deleteRow(1);
        rowCount = table.rows.length;
    }
    // add rows to table
    let row = 1;
    for (let i = 0; i < array.length; i ++) {
        let newRow = table.insertRow(row);
        let cell1 = newRow.insertCell(0);
        let cell2 = newRow.insertCell(1);
        let cell3 = newRow.insertCell(2);
        let cell4 = newRow.insertCell(3);
        let cell5 = newRow.insertCell(4);
        let cell6 = newRow.insertCell(5);
        let cell7 = newRow.insertCell(6);

        let symb = array[i].symbol;
        let qnty = array[i].quantity
        let pric = array[i].price;
        let cost = array[i].quantity * array[i].price;
        let buys = array[i].buySell;
        let date = array[i].date;
        let gain = array[i].gainLoss;

        cell1.innerHTML = array[i].symbol;
        cell2.innerHTML = array[i].quantity
        cell3.innerHTML = array[i].price;
        cell4.innerHTML = array[i].quantity * array[i].price;
        cell5.innerHTML = array[i].buySell;
        cell6.innerHTML = array[i].date;
        cell7.innerHTML = array[i].gainLoss;
        row ++;
    };
}  // BuildHistoryDetailsTable() 


// build summaryTable
function BuildSummaryArray(BoughtOrSold) {
    // save new stock into clone
    let symbol = tradeArray[0].symbol;
    let quantity = tradeArray[0].quantity;
    let buySell = tradeArray[0].buySell;
    let cost = quantity * parseInt(tradeArray[0].price);
    let value = cost;

    if (summaryArray.length < 1) {    // save if array is empty
        summaryArray.push(new netValueObject(symbol, quantity, cost, value));
    } else {    
        // search new symbol in summaryArray
        let idx = FindSymbol(symbol);

        if (idx == -1) {   // not is array, save
            summaryArray.push(new netValueObject(symbol, quantity, cost, value));
        } else {
            // found symbol in summaryArray, update quantity and value
            let sign = (buySell === "Bought") ? 1 : -1;
            let newQuantity = summaryArray[idx].quantity + (sign * quantity);
            let newCost;
            if (buySell === "Bought") {
                // when buying, add the current buy cost to the current cost
                newCost = summaryArray[idx].cost + (sign * cost);  // =.cost-quantity*buyPrice
            } else {
                // when selling, subtract the previous cost (for the sell quantity) from the current cost
                newCost = summaryArray[idx].cost - origBuyCost;
            }
            // let newCost = 
            let newValue = newCost + netGain;   // =.cost-newQuantity*buyPrice+quantity*(sP-bP)
            summaryArray[idx].quantity = newQuantity;
            summaryArray[idx].cost = newCost;
            summaryArray[idx].value = "";          // newValue;    // ?????
        }
    }
}  // BuildSummeryArray()


function BuildSummaryTable() {   
    let rowCount = s_table.rows.length;
 
    // remove all data rows from table (except header)
    while (rowCount > 1 ) {
        s_table.deleteRow(1);
        rowCount = s_table.rows.length;
    }
    // add rows to table
    let row = 1;
    for (let i = 0; i < summaryArray.length; i ++) {
        let newRow = s_table.insertRow(row);
        let cell1 = newRow.insertCell(0);   // symbol
        let cell2 = newRow.insertCell(1);   // quantity
        let cell3 = newRow.insertCell(2);   // cost
        let cell4 = newRow.insertCell(3);   // value

        let symbol_dbg = summaryArray[i].symbol;     // DEBUG
        let quantity_dbg = summaryArray[i].quantity; // DEBUG 
        let cost_dbg   = summaryArray[i].cost;       // DEBUG
        let value_dbg  = summaryArray[i].value;      // DEBUG, NOT USED    

        cell1.innerHTML = summaryArray[i].symbol;
        cell2.innerHTML = summaryArray[i].quantity;
        cell3.innerHTML = summaryArray[i].cost;
        cell4.innerHTML = summaryArray[i].value;
        row ++;
    };
}  // BuildSummaryTable()
// -------------------- end Building tables --------------------------------//



// ------------------- calculate gain loss ---------------------------------//
// calculate gain loss, also update buyArray

function UpdateGainLoss(symbol, sellQuantity, sellPrice) {
    gainLoss = 0; 
    let buyCost = 0; 
    // searching for symbol to calculate gain loss
    for (let i = 0; i < buyArray.length; i++) {
        if (symbol === buyArray[i].symbol) {
            let buyQuantity = parseInt(buyArray[i].quantity); 
            let buyPrice = parseInt(buyArray[i].price);   
            origBuyCost = sellQuantity * buyPrice;             
            if (buyQuantity >= sellQuantity) {   // current stock (1st buy) has enough quantity to sell
                let newQuantity = buyQuantity - sellQuantity;

                buyCost += sellQuantity * buyPrice;
                gainLoss += sellQuantity *(sellPrice - buyPrice);

                if (newQuantity > 0) {
                    buyArray[i].quantity = newQuantity;
                } else {
                    // buyArray.splice(buyArray[i], 1);  // remove the item with 0 share
                    buyArray.splice(i, 1);  // remove the item with 0 share
                }
            } else {   // current stock (1st buy) doesn't have enough quantity to sell. Keep searching
                let j = i;
                let accumQuantity = 0;
                while (accumQuantity < sellQuantity ) {
                    let buyQuantity_j = parseInt(buyArray[j].quantity);
                    let buyPrice_j = parseInt(buyArray[j].price);
                    accumQuantity += buyQuantity_j;

                    buyCost += sellQuantity * buyPrice_j;
                    gainLoss += sellQuantity *(sellPrice - buyPrice_j);

                    j ++;
                }
                j --;
                // remove buyArray used
                if (accumQuantity == sellQuantity) {
                    for (let k = i; k <= j; k++) {
                        buyArray.splice(i, 1); 
                    }
                } else {
                    for (let k = i; k < j; k++) {
                        buyArray.splice(i, 1);
                    }
                    let newQuantity = accumQuantity - sellQuantity;
                    buyArray[i].quantity = newQuantity;
                }
            }
            buyArray[i].gainLoss = gainLoss;
            netGain = gainLoss;
            break;
        }
    }
}  // UpdateGainLoss()


// // ------------------------- DEBUG ------------------------------------//

// function DisplayBuyArrayDEBUG() {
//     // b_table = document.getElementById("buyTable");
//     let rowCount = b_table.rows.length;
//     while (rowCount > 1 ) {
//         b_table.deleteRow(1);
//         rowCount = b_table.rows.length;
//     }
//     let row = 1;
//     for (let i = 0; i < buyArray.length; i ++) {
//         let newRow = b_table.insertRow(row);
//         let cell1 = newRow.insertCell(0);   // symbol
//         let cell2 = newRow.insertCell(1);   // quantity
//         let cell3 = newRow.insertCell(2);   // value
//         let cell4 = newRow.insertCell(3); 
//         cell1.innerHTML = buyArray[i].symbol;
//         cell2.innerHTML = buyArray[i].quantity;
//         cell3.innerHTML = buyArray[i].price;
//         cell4.innerHTML = buyArray[i].gainLoss;
//         row ++;
//     };
// }  // DEBUG DisplayBuyArrayDEBUG
// // --------------------- end DEBUG -------------------------------------//


$(document).ready(function() {
    // console.log("1.0 " + "   " +  "Ready");
    d_table = document.getElementById("detailsTable");
    // console.log("1.1 " + "   " + d_table.id);
    h_table = document.getElementById("historyTable");
    // console.log("1.2 " + "   " + h_table.id);
    s_table = document.getElementById("summaryTable");
    // console.log("1.3 " + "   " + s_table.id);
    cash = document.getElementById("cash");
    b_table = document.getElementById("buyTable");     // DEBUG
    // console.log("1.4 " + "   " + b_table.id);

    location.replace(href="#home");   // switch to the home page

});

document.addEventListener("DOMContentLoaded", function () {    


    //--------------------- trade: button Buy/Sell -----------------------------//

    document.getElementById("buttonTrade").addEventListener("click", function () {

        let symbol = document.getElementById("symbol").value;
        let tradeDate = document.getElementById("tradeDate").value;
        let quantity = parseInt(document.getElementById("quantity").value);
        let price = parseInt(document.getElementById("price").value);
        let buySell = document.getElementById("select-buysell").value;
        let boughtSold = (buySell === "buy") ? "Bought" : "Sold";
 
        gainLoss = "";
        let cost = quantity * price;

        // save in buyArray
        tradeArray.push(new stockObject(symbol, quantity, price, boughtSold, tradeDate, gainLoss));

        // if buying, check enough cash
        let avail_cash = parseInt(cash.value);
        if ((cost <= avail_cash) && (buySell == "buy") || (buySell === "sell")) {

            if (buySell === "buy") {
                buyArray.push(new stockObject(symbol, quantity, price, boughtSold, tradeDate, gainLoss));
                buyArray.sort(bySymbol);
                // update available cash
                let newCash = avail_cash - cost;
                cash.value = newCash;
            } else {
                UpdateGainLoss(symbol, quantity, price);  // use buyArray
                // update available cash
                let newCash = avail_cash + cost - origBuyCost;
                cash.value = newCash;
            }

            // update historyTable
            historyArray.push(new stockObject(symbol, quantity, price, boughtSold, tradeDate, gainLoss));
            BuildHistoryDetailsTable(h_table, historyArray);  // history table

            // update gainLoss in tradeArray to build in detailsTable
            tradeArray.gainLoss = gainLoss;                   // ????? CAN'T PUSH gainLoss ?????
            BuildHistoryDetailsTable(d_table, tradeArray);    // details table
            
            BuildSummaryArray(boughtSold);                    // use tradeArray
            BuildSummaryTable();
    
            // // DEBUG: display buyArray
            // DisplayBuyArrayDEBUG();
    
            // go to the next page
            returnPage = "trade";
            document.location.href = "index.html#details";
        } else {
            alert("Not enought cash for buying shares!");
        }
        tradeArray = [];
        gainLoss = "";
    });

    //------------------- end trade: button Buy/Sell ----------------------------//
 



    //--------------------- Display table functions -----------------------------//

   
    document.getElementById("buttonClear").addEventListener("click", function () {
        document.getElementById("symbol").value = "";
        document.getElementById("quantity").value = "";
        document.getElementById("price").value = "";
        document.getElementById("select-buysell").value = "Buy";
    });

    $(document).bind("change", "#select-genre", function (event, ui) {
        selectedGenre = $('#select-genre').val();
    });

    document.getElementById("return").addEventListener("click", function () {
        if (returnPage === "trade") {
            returnPage = "";
            document.location.href = "index.html#trade";    // go back to trade page
        }else {
            document.location.href = "index.html#history";  // go back to history list 
        }       
    });

// end of add button events ************************************************************************

  

  
// page before show code ********************************************************************
    // page before show code ****************************************************************
    // $(document).on("pagebeforeshow", "#history", function (event) {   // have to use jQuery 
    //     // createList();
    //     document.location.href = "index.html#history"; 
    // });

    // $(document).on("pagebeforeshow", "#summary", function (event) {   // have to use jQuery 
    //     // clear prior data
    //     var divStockList = document.getElementById("divStockListSubset");
    //     while (divStockList.firstChild) {    // remove any old data so don't get duplicates
    //         divStockList.removeChild(divStockList.firstChild);
    //     };
    // });

    // need one for our details page to fill in the info based on the passed in ID
    // $(document).on("pagebeforeshow", "#details", function (event) {   // have to use jQuery 
    //     let localID = document.getElementById("IDparmHere").innerHTML;
    //     let arrayPointer = GetArrayPointer(localID);
    //     // document.getElementById("oneTitle").innerHTML = "The title is: " + movieArray[arrayPointer].Title;
    //     // document.getElementById("oneYear").innerHTML = "Year released: " + movieArray[arrayPointer].Year;
    //     // document.getElementById("oneGenre").innerHTML = "Genre: " + movieArray[arrayPointer].Genre;
    //     // document.getElementById("oneWoman").innerHTML = "Leading Woman: " + movieArray[arrayPointer].Woman;
    //     // document.getElementById("oneMan").innerHTML = "Leading Man: " + movieArray[arrayPointer].Man;
    //     // document.getElementById("oneURL").innerHTML = movieArray[arrayPointer].URL;
    // });
 
// end of page before show code *************************************************************************

});  
// end of wait until document has loaded event  *************************************************************************

// next 2 functions could be combined into 1 with a little work
// such as I could pass in a variable which said which divStockList div it should draw
// to, and if no value is passed in to subset too, I could just include all.

// function createList() {
//     // clear prior data
//     var divStockList = document.getElementById("divStockList");
//     while (divStockList.firstChild) {    // remove any old data so don't get duplicates
//         divStockList.removeChild(divStockList.firstChild);
//     };

//     var ul = document.createElement('ul');

//     movieArray.forEach(function (element,) {   // use handy array forEach method
//         var li = document.createElement('li');
//         // adding a class name to each one as a way of creating a collection
//         li.classList.add('oneMovie'); 
//         // use the html5 "data-parm" to encode the ID of this particular data object
//         // that we are building an li from
//         li.setAttribute("data-parm", element.ID);
//         li.innerHTML = element.ID + ":  " + element.Title + "  " + element.Genre;
//         ul.appendChild(li);
//     });
//     divStockList.appendChild(ul)

//     // now we have the HTML done to display out list, 
//     // next we make them active buttons
//     // set up an event for each new li item, 
//     var liArray = document.getElementsByClassName("oneMovie");
//     Array.from(liArray).forEach(function (element) {
//         element.addEventListener('click', function () {
//         // get that data-parm we added for THIS particular li as we loop thru them
//         var parm = this.getAttribute("data-parm");  // passing in the record.Id
//         // get our hidden <p> and write THIS ID value there
//         document.getElementById("IDparmHere").innerHTML = parm;
//         // now jump to our page that will use that one item
//         document.location.href = "index.html#details";
//         });
//     });

// };

// function deleteMovie(which) {
//     console.log(which);
//     let arrayPointer = GetArrayPointer(which);
//     movieArray.splice(arrayPointer, 1);  // remove 1 element at index 
// }

// // cycles thru the array to find the array element with a matching ID
// function GetArrayPointer(localID) {
//     for (let i = 0; i < movieArray.length; i++) {
//         if (localID === movieArray[i].ID) {
//             return i;
//         }
//     }
// }
  

// function createListSubset(whichType) {
//     // clear prior data
//     var divStockList = document.getElementById("divStockListSubset");
//     while (divStockList.firstChild) {    // remove any old data so don't get duplicates
//         divStockList.removeChild(divStockList.firstChild);
//     };

//     var ul = document.createElement('ul');

//     movieArray.forEach(function (element,) {
        
//         if (element.Genre === whichType) {
//             // use handy array forEach method
//             var li = document.createElement('li');
//             // adding a class name to each one as a way of creating a collection
//             li.classList.add('oneMovie');
//             // use the html5 "data-parm" to encode the ID of this particular data object
//             // that we are building an li from
//             li.setAttribute("data-parm", element.ID);
//             li.innerHTML = element.ID + ":  " + element.Title + "  " + element.Genre;
//             ul.appendChild(li);
//         }
//     });
//     divStockList.appendChild(ul)

//     // now we have the HTML done to display out list, 
//     // next we make them active buttons
//     // set up an event for each new li item, 
//     var liArray = document.getElementsByClassName("oneMovie");
//     Array.from(liArray).forEach(function (element) {
//         element.addEventListener('click', function () {
//             // get that data-parm we added for THIS particular li as we loop thru them
//             var parm = this.getAttribute("data-parm");  // passing in the record.Id
//             // get our hidden <p> and write THIS ID value there
//             document.getElementById("IDparmHere").innerHTML = parm;
//             // now jump to our page that will use that one item
//             document.location.href = "index.html#details";
//         });
//     });

// };

/**
 *  https://ourcodeworld.com/articles/read/764/how-to-sort-alphabetically-an-array-of-objects-by-key-in-javascript
* Function to sort alphabetically an array of objects by some specific key.
* 
* @param {String} property Key of the object to sort.
*/
// function dynamicSort(property) {
//     var sortOrder = 1;

//     if (property[0] === "-") {
//         sortOrder = -1;
//         property = property.substr(1);
//     }

//     return function (a, b) {
//         if (sortOrder == -1) {
//             return b[property].localeCompare(a[property]);
//         } else {
//             return a[property].localeCompare(b[property]);
//         }
//     }
// }

// sort the array
function bySymbol(a, b) {
    let comparison = 0;
    if (a.symbol > b.symbol) {
      comparison = 1;
    } else if (a.symbol < b.symbol) {
      comparison = -1;
    }
    return comparison;
}

// serach summaryArray for symbol
function FindSymbol(symbol) {
    for (let i = 0; i < summaryArray.length; i++) {
        if (summaryArray[i].symbol === symbol)
        return i;
    }
    return -1;
}