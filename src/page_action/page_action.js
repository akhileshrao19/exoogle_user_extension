const KEY = 'AIzaSyBShPw_62JpgZ4R4yvVNqWxFrL7PqQ_beQ';
const CX = '000338470165546782277:e3hycfajgt0';
const CSE = `https://www.googleapis.com/customsearch/v1/?key=${KEY}&cx=${CX}`;
const NEXT_PAGE_THRESHOLD = 2;
const DEBOUNCE_TIME_SEC = 1500;

let currentTab = undefined;

function updateCurrentTab(tab){
    currentTab =tab;
    controller(currentTab.url);
}

// Entry point of app
chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
   updateCurrentTab(tabs[0])
});

// On Tab Url Update
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (tab.url.match(/https:\/\/www.google.com\/*/)){
        updateCurrentTab(tab)
    }else{
        window.close()
    }
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

makeRecord = debounce(makeRecord, DEBOUNCE_TIME_SEC);

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
    let search = cleanUrl(url);
    if (!search.includes('q=')) {
        return null;
    }
    if (search[0] === '?') {
        search = search.substr(1);
    }
    return `${CSE}&${search}`;

}

/*
main Controller
 */
function controller(tabUrl) {
    const element = getElement();
    const CSEURL = makeCSEUrl(tabUrl);
    if (CSEURL) {
        makeApiCall(CSEURL)
            .then(response => {
                if (response.items) {
                    element.innerHTML = response.items.map(item => renderResult(item)).join('\n');
                    addOnClick();
                    fetchNextPage(CSEURL, 1, NEXT_PAGE_THRESHOLD);
                } else {
                    element.innerHTML = `<h3> No result Found </h3>`;
                }
            })

    } else {
        element.innerHTML = `<h3> Nothing To search </h3>`;
    }
}


/*
make CSE call
 */
function makeApiCall(url) {
    return $.get(url)
}

/*
 Render Result
*/
function renderResult(item) {
    return `<div><a href="${item.link}"><h3 data-href="${item.link}">${item.title}</h3></a><cite class="iUh3">${item.htmlFormattedUrl}</cite><span class="st">${item.htmlSnippet}</span></div>`
}

/*
return main element
 */
function getElement(){
    return document.getElementById('mainPopup')
}


function fetchNextPage(CSEURL, index, count){
    if (!count) {
        return
    }
    const newUrl = `${CSEURL}&start=${10*index}`;
    return makeApiCall(newUrl)
        .then(response => {
            console.log(response);
            if (response.items) {
                fetchNextPage(CSEURL, index+1, count-1);
                response.items.map(item => $.parseHTML(renderResult(item))).forEach(html => {
                    getElement().append(html[0])
                });
                addOnClick();
            }
        })

}
