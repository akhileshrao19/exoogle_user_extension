const KEY = 'AIzaSyBShPw_62JpgZ4R4yvVNqWxFrL7PqQ_beQ';
const CX = '000338470165546782277:e3hycfajgt0';

let currentTab = undefined;

chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
    currentTab = tabs[0];
    makeApiCall(currentTab.url);
});

/*
Return search params
 */
function cleanUrl(url) {
    const a = document.createElement('a');
    a.href = url;
    return a.search
}

function debounce(callback, wait) {
    let timeout;
    return (...args) => {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => callback.apply(context, args), wait);
    };
}

function makeRecord(event) {
    if (event) {
        return $.post('http://localhost:8000/api/user-data/', {domain: event.target.dataset.href})
    } else {
        console.log('event not passed');
    }
}

makeRecord = debounce(makeRecord, 1000);

function redirect(event) {
    /*
    Make record in app
     */
    makeRecord(event);
    chrome.tabs.update(currentTab.id, {url: event.target.dataset.href});
}

/*
Add on click handler
 */
function addOnClick (){
    const anchors = [...document.getElementsByTagName('h3')];
    anchors.forEach(anchor=>{anchor.onclick=redirect})
}

/*
Make CSE url
 */
function makeCSEUrl(url) {
    const popup = document.getElementById('mainPopup');
    let search = cleanUrl(url);
    if (!search.includes('q=')){
        popup.innerHTML = `<h3> Nothing To search </h3>`
    }
    if (search[0] ==='?') {
        search = search.substr(1);
    }
    const finalUrl = `https://www.googleapis.com/customsearch/v1/?key=${KEY}&cx=${CX}&${search}more:django`;
    $.get(finalUrl).then((response) => {
            const finalHTML = response.items? response.items.map((item) => {
                    return `<div> 
                                <a href="${item.link}">  
                                    <h3 data-href="${item.link}">${item.htmlTitle}</h3>
                                 </a>
                                <cite class="iUh3">${item.htmlFormattedUrl}</cite>
                                <span class="st">${item.htmlSnippet}</span>
                              </div>`
            }): `<h3> No result Found </h3>`;
            popup.innerHTML = `<div>${ Array.isArray(finalHTML)? finalHTML.join('\n'): finalHTML}</div>`;
            addOnClick();
        }
    );
    return finalUrl
}

/*
make CSE call
 */
function makeApiCall(parentURL) {
    makeCSEUrl(parentURL);
}
