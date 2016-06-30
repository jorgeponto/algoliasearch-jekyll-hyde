(function(config){
  'use strict';
  var JekyllAlgolia = {
    init: function() {
      this.client = algoliasearch(config.applicationId, config.apiKey); // Algolia client
      this.helper = algoliasearchHelper(this.client, config.indexName); // Algolia Helper

      this.$searchBox = $(config.searchBoxSelector); // <input> search box
      this.$searchResultsContainer = $(config.searchResultsSelector); // Where to display the results

      // Each record is a paragraph, so we need to group them by parent
      // page/post
      this.helper.setQueryParameter('distinct', true);
      // Listen to each keystroke in the search box
      this.$searchBox.on('keyup', JekyllAlgolia.onQueryChange);
      // Callback on each new results
      this.helper.on('result', JekyllAlgolia.onResult);
      // result template
      this.templateResult = Hogan.compile($(config.templateResultSelector).html());
      // Init the search result element
      this.initSearchResultsElement();
    },

    // The search results element will keep displaying its default content on
    // page load, but will display results when a search is activated
    initSearchResultsElement: function() {
      // We create a new wrapper around the initial content
      var initialContentHolder = $('<div class="ajs-results--initial"></div>');
      this.$searchResultsContainer.children().appendTo(initialContentHolder);
      initialContentHolder.appendTo(this.$searchResultsContainer);

      // We add a wrapper for displaying results
      var searchContentHolder = $('<div class="ajs-results--search"></div>');
      searchContentHolder.appendTo(this.$searchResultsContainer);
      // We handle clicks on link in the search results in a specific manner
      searchContentHolder.on('click', 'a', JekyllAlgolia.onLinkClick);

      // Expose the DOM elements in the whole object
      this.$initialContent = initialContentHolder;
      this.$searchContent = searchContentHolder;
    },

    // Called everytime a new character is added or removed to the search box
    onQueryChange: function() {
      // We get the current value of the searchbox and expose it
      var currentQuery = JekyllAlgolia.$searchBox.val();
      JekyllAlgolia.currentQuery = currentQuery;

      // If it's empty, we revert to display the initial content instead of the
      // results
      if (!currentQuery.length) {
        JekyllAlgolia.hideResults();
        return false;
      }

      // Start a search with this query
      JekyllAlgolia.helper.setQuery(currentQuery).search();
    },
    // Called everytime a new set of results is received from the API
    onResult: function(data) {
       // Request being asynchronous, this callback might not be called in the
       // same order as the onQueryChange that started it. To avoid race
       // conditions, we simply discard callbacks that do not match the current
       // query
      if (data.query !== JekyllAlgolia.currentQuery) {
        return false;
      }

      JekyllAlgolia.showResults();

      var hasResults = data.nbHits > 0;
      if (!hasResults) {
        JekyllAlgolia.displayNoResults();
      } else {
        JekyllAlgolia.displayResults(data.hits);
      }
    },
    // Clicking on a link of a search results need to be handled specifically
    onLinkClick: function(event) {
      var currentPathName = window.location.pathname;
      var linkPathName = event.target.pathname;
      // If following a link to another page, follow it normally
      if (currentPathName !== linkPathName) {
        return true;
      }

      // If link to same page, we reset the search and hide the results
      JekyllAlgolia.$searchBox.val('');
      JekyllAlgolia.hideResults();
    },
    // Hide the search results and show the initial content
    hideResults: function() {
      JekyllAlgolia.$searchContent.hide();
      JekyllAlgolia.$initialContent.show();
    },
    // Show the search results and hide the initial content
    showResults: function() {
      JekyllAlgolia.$initialContent.hide();
      JekyllAlgolia.$searchContent.show();
    },
    // Display the "Sorry, no results"
    displayNoResults: function() {
      JekyllAlgolia.$searchContent.html('No results found.');
    },
    // Display the list of results
    displayResults: function(results) {
      var content = $.map(results, function(hit) {
        // We use the full url for the link
        var url = config.baseUrl + hit.url;
        if (hit.anchor) {
          url += '#' + hit.anchor;
        }

        // We convert the date to a readable version
        var date = null;
        if (hit.date) {
          date = moment.unix(hit.date).fromNow();
        }

        // We use highlighted versions of the title
        var title = hit._highlightResult.title.value;

        // We use snippeted version of the text
        var text = hit._snippetResult.text.value;

        return JekyllAlgolia.templateResult.render({
          url: url,
          title: title,
          date: date,
          text: text
        });
      });

      JekyllAlgolia.$searchContent.html(content.join('\n'));
    }
  };

  $(function() {
    JekyllAlgolia.init(config);
  });
}(window.ALGOLIA_CONFIG));
