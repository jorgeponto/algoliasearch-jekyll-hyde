Default configuration indexes everything.
We'll see a common front-end implementation
Example on the Hyde theme

jekyll algolia push, check that everything is correctly setup
otherwise, refer to the indexing readme/tutorial

First, the generic configuration (appid, indexname)
then a bit of specific API settings (we'll see it later)

and other information that will basically be passed to the view. I put it here
so I put all the relevant data in the same file, but you can do it a different
way
How do I pass it to the view? I edit the footer.html layout and pass
a window.ALGOLIA_CONFIG where I copy all I need. It will first be parsed by the
liquid language of Jekyll (converting all the {{ value }}) and will in the end
result in a global js variable

Then I add my js file. algolia.js
I wrap everything in a self invocating function, to be sure to not pollute too
much the global space (ok, I did it already for the global ALGOLIA_CONFIG)...

In it I define a JekyllAlgolia object, and a $(function() { JekyllAlgolia.init }); method
the one wrapped in $() will be called only on DOM ready, when the page will be
cmpletly loaded (and hence all deps loaded)
I uses jQuery because it makes my code example concise, but you can use anything
else, I'm basically only using it for DOM selection, event handling, HTML
replacing and $.map

The init method instanciate all I need
the APi client and helper. main bricks of the front-end
(TODO: maybe I don't need the helper)

I activate distinct, to be sure to only get one hit per page.
(TODO: Check if needed in the front-end)

In the exiting HTML, I just add to add an input to the sidebar (with a class of
ajs-searchbox) and mark the element where I want the results to be dsplayed with
the ajs-results class. Those classes are abitrary, you can use whatever classes
you want, but don't forget to update the references accordingly in the rest of
the guide. I chose to follow the BEM convention (ajs- prefix) to avoid leaking
on existing styles in the theme.

I then hook up to events, and do a bit of HTML bootstrapping.
The first event is listening to keysrokes in the input. The second one is
listening to API call responses, to update the display. On each new keystroke we
fire an API call, on each response of the API, we display the results

The initial bootstraping is preparing where to displau the results. You usually
do not want to have a dedicated page for search. you want your search on every
page, with the search box in the sidebar. But where to put the resulst?
(Note: I use a $ at the start of the variable, un hungarian notation style, to
make it epxlicit it's a jquery instance)

usually, you dosplay the results in the main display area, where the content is.
So on a normal navigation people will read the content, but hen they start
searching, the content is replaced with the search results. When they remove
their keywords, the inital content is replaced

to do that, we will create two div placeholders. We select one parent element,
where the content is currently displayed (container), and move its current
content into an intermediate wrapper div (initial content), and add a new
sibling to this new div (search content). We will then hide/show them based on
the status (is the user searching or reading?)

I used ajs-results--search and ajs-results--initial for those two elements.
I tried to follow BEM, as to make clear selectors for each part, and not leaking
in the rest of the page. ajs- (Algolia Jekyll Search) should be failry unique as
a prefix

Moving DOM nodes here is mostly jQuery gymnastic. We create a new DOM node, we
take all the children of our container and move them to this node. Then we
happen the node to the document, in the container. Finally, we happen our empty
search result container after it.

// TODO, example of before/after

Now, let's focus on the searchbox. The onQueryChange method is called everytime
a new keystroke is added
We get the value through val(). Because the API calls are asynchronous, we need
to avoid race conditions, so we keep a global reference to the last query done.
We'll see why later.
// TODO: Check if needed, might be handled in the helper already

We then tell the helper to do a query with those keywords and start a new
searcj. We will now wait for the onResult event.

One thing to note is the special case when the searchbox is emptied. It means
the user wants to stop searching. in that case, we do not start any query and we
simply hide the results and display back the original content.

I created an hideResults() methods to do that (it will be used later again).

In the onResults, we receive the results of the search, along with the keywords
(query) sent. rememer the lastQuery we saved eaerlier? We'll use it to compare
it against the query sent with the response. We need it to avoid race
conditions.

A race condition here would be when you type "AB". The onKeyChange events are
fired in the right order (first A, then B). And after each event, we do
a network call to the API, so it's acuall:
- type A
- send "A" to api
- type B
- send "AB" to the api

But network is unreliable. Nothing guarantes that the response to "AB" will
arrive after the response to "A". So, in the onResult we check the query that
was done, and if it's not the matching what is currently written in the
searchbox, we discard it. We are only interested in the response matching what
is in the searchbox.

First thing we do is display our result container (and hide the initial one).
once again, I put that into a function to make is easier to understand.

But we have two versions to handle. The usual one is displaying all the results,
but the less common one is when there is no results (you type "ZZZ" and no
records matches "ZZZ"). So we need two ways of displaying the results.

To make things easier to understand, I created the displayNoResults and
displayResults methods. The displayResults methods takes the data.hits (list of
actual records matching the query) as an argument.

Both method will take the searchResult container DOM element and change its html
value. The noResults is easy and will simply replace its content with a single
sentence.

For the list of results, it will be a bit more complex. The main idea will be to
loop through the list of matching records and generate an HTML version of it,
and add it to the html.

I did not want to bother aggregating a long sring of HTML in javascript, so
I used Hogan. Hogan is an implementation of the Mustache templating language
that helps you write templates with a syntax close to what you are used to with
liquid in Jekyll.

I loaded Hogan from the CDN, adding it in the footer. I defined a template in
the HTML, following the common advice of using a script with a language of
x-template. Because Hogan and Liquid have very similar syntaxes, using one in
the other requires a little trick.

The Hogan template must be wrapped in raw and endraw tags, so it will not be
parsed by Liquid. I simply put my HTML template in the script tag, of how
I would like my records to be displayed. I need the title (with a link) and the
text.

// TODO: simple example with only link/title + text. Ni highlight, no date

Now I need to prepare this a bit. I chose to put it in the int function. I grab
the template, and pass to Hogan.compile. This gives me a method that I will be
able to call on a record to get the HTML version of it

// TODO: Give an example of a call with the html, the object, the compile, the
final output

Then I use the $.map utility to get an array of all the HTML results from the
initial list of hits. I join this array and pass it to the html of the results

// TODO: return a new object, not the initial hit (will be easier for later)

Note that most jekyll example (including github pages), are suggesting to use
the baseurl option, to be able to test the website locally as well as deply it
with the same config. I followed that nice advice as well, but it means that you
need to slightly modify the url variable by prefixing the baseurl. As usual, to
get this value from your config.yml you need to pass it to the footer.html an
main config object

So far it is working really well. The last parts will be the final wteaking and
improvements.

First, I need ot have results that looks nice. Improve the size of the search
bar to make is more usable. Have results that look like real posts, higlight the
matching words, add the date of the post and only display the interesting part
of the paragraph

I added an algolia.css file where I add a tiny bit of padding to the search box.
Then I copy a bit the riginal styling to make the results look nicer
// TODO: basic css to make it look better

The API provides highligting by default, you just need to access it. instead of
using the hit.title, you can use the hit.highlightResult.title.value.
Highlighting uses an HTML tag around the matching words to let you highlight
them using CSS. By default it's an `em`. Note that by default Hogan will escape
HTML tags. To be able to use the real HTML tag, you will need to use three {}
instead of two.

Also, I did not want to use the default `em` for the highlight and chose to use
amore specific CSS class, `ajs-highlight`. I just had to update my
algoli.settings in config.yml to define the highlightPretag and highlightPostTag

// TODO: screenshot

Another feature that is available trough the API is the snippeting of results.
Here (TODO: add screensot). We can see that the matching paragraph is quite big
and the matching words are lost in the middle. Wth snippeting we can define how
much text around the matching words we want. This feature is not enabled by
default, but you just have to edit your config.yml once again to get it.
algolia.settings.attributesToSnippet. You define the name of the attribute and
the number of characters around. 40 seems enough.
You can also define the character to be used to mark the start or end of an
unfinished sentence. I used … with snippetEllipsisText.
To use it, you just have to swith highlightResult with snippetResult

Finally, for posts (not for pages), we could add the date of the posting. Maybe
even better, we could display the relative date (like 15mn ago, one year ago).
To do it, I will use the awesome moment.js library and just pass a new attribute
to the render method and update the template accordingly. In the template I wrap
the element in a condition because not all records will have the information(
pages do not have a date for example).

// TODO: Screensht
Isn't it looking so much better now?

If you stop reading her,e you will alreayd have done most of the work. there are
a few edge cases and improvement to be made, so if you'r interested, follow on

The first one was a bug to fix. When you are on /foo.html and do a search, it is
possible that some of the results will actually point to /foo.html and with our
current script it will just not work. Clicking on a link will try to change the
page, but because it is the same nothing will happen.

To fix that, we will add a click handle event on the search reuslt containe
(filtered only when clicking on link). In this method we'll cheeck if the
clicked link goes to a new page or to the same. If going to a new page, we just
let it work normally. If the same, we will reset the search and hide the
results.

Second one is a small improvement. Because the records contains the name of the
closest anchor, we could actually let users go to heading that is the closest to
the paragraph display. To do so, I just have to add the anchor to the url before
passing the url to the template if an anchor is defined.

The last improvement is a small perf imrpovement. By default the API will return
all the attributes of the records. But here, we are only using a few of them
(url, anchor, text, title and date). We do not need the full hierarchy of
titles, the slug or the other information stored in the front-matter.

To make the API response lighter (and thus faster to download), we will tell the
API to not retrieve them. Once again, it's editable in the config.yml

//TODO: conclusion

//TODO: Maybe move the selectors in the js/html directly?

