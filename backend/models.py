from pydantic import BaseModel

#
# Models for contextualization requests
#

class ContextInput(BaseModel):
    url: str = ""

class ContextResponse(BaseModel):
    authors: list = None
    published_date: str = None
    found_claims: list = None
