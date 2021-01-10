function* fuzzySieve(data, query) {
    const makeListElement = match => {
        let li = document.createElement("li");
        for (const group of match.groups) {
            let span = document.createElement("span");
            if (group.match) span.classList.add("fuzzy-select-inline-match");
            span.textContent = group.value;
            li.appendChild(span);
        }
        return li;
    };

    re = new FuzzyRegExp(query);
    let nonExactMatches = [];

    for (const item of data) {
        const match = re.exec(item);
        if (match.match === true) {
            /* Yield exact matches immediately. */
            if (match.type === "exact") yield makeListElement(match);
            /* Only save moderately fuzzy matches for later yielding, the average length of
             * matched substrings being a measure of fuziness. 1.5 is arbitrary. */
            else if (match.groups.length < 4
                || ((query.length
                     / match.groups.reduce((count, group) => group.match ? count + 1 : count , 0))
                    > 1.5))
            {
                nonExactMatches.push(match);
            }
        }
    }

    /* Sort the remaining matches with respect to the number of groups, so those with longer
     * match groups come first. */
    nonExactMatches.sort((a, b) => a.groups.length - b.groups.length);
    for (const match of nonExactMatches) {
        yield makeListElement(match);
    }
}

let processes = new Set();

window.addEventListener("load", e => {
    ajaxUtils.makeAjaxCall(
        "https://oekobilanz.fkretlow.vercel.app/api?query=processes:format=json", "GET", true
    ).then(json => {
        json.data.forEach(item => {
            processes.add(item.name);
        });
    });
    const input = document.querySelector("#select-input");
    const output = document.querySelector("#select-output");
    const handler = new FuzzySelect(input, output, processes, fuzzySieve, "select process");
});
