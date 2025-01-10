# Search

The entry point for search is a search bar at the top of the screen.  When the user enters a search we should display the search results pane instead of the primary or secondary chat panels.

Inside of the search results pane we should display a list of SearchResult components.  A search result component contains ChannelName, and up to 3 messages - the message before the match, the match, and the message after the match.  Clicking on a search result should open the channel.

# Server code


class SearchResult(BaseModel):
    channel_id: str
    channel_name: str
    message: Message
    previous_message: Optional[Message] = None
    next_message: Optional[Message] = None
    score: float

class SearchResponse(Response):
    messages: List[SearchResult]

@app.post("/search")
async def search(request: SearchRequest) -> SearchResponse:
    """
    Search for messages containing the search query.
    Returns messages with context (previous and next messages) and relevance score.
    """
    try:
        search_results = dl.search_messages(request.search_query)
        return SearchResponse(
            message="Search completed successfully",
            ok=True,
            messages=[SearchResult(**result) for result in search_results]
        )
    except Exception as e:
        return SearchResponse(
            message=f"Search failed: {str(e)}",
            ok=False,
            messages=[]
        )