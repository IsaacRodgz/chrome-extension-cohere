import os
from fastapi import FastAPI, HTTPException
from deta import Base, Deta
from models import (
    ContextInput,
    ContextResponse
)
from utils import parse_website, get_claims_form_text, get_claim_embeddings, verify_claims
from utils import get_logger

import cohere
from annoy import AnnoyIndex

logger = get_logger(__name__)
app = FastAPI()

#   
# get connection to all DBs
#

# DB of web URLs that users report as fake

logger.info("Loading DB...")
deta = Deta(os.environ['DETA_KEY'])
claims_db = deta.Base("claims-db")

#
# Cohere connection
#

logger.info("Connecting to Cohere")
co = cohere.Client(os.environ['API_KEY'])
co_gen = cohere.Client(os.environ['API_KEY_GEN'])

#
# Load Annoy embedding DB
#

logger.info("Loading Embedding store")
emb_size = 4096
search_index = AnnoyIndex(emb_size, 'angular')
search_index.load('claims.ann')

#
# Endpoints
#

@app.get("/health")
def health_check():
    """
    Regular Health endpoint
    """
    return {"health":True}


@app.post("/verify", response_model=ContextResponse)
def verify(item: ContextInput):
    """
    Main endpoint to extract article info and search for validated claims in DB
    """

    # Search for claims in DB and extract article info (author, published date, etc)
    try:
        logger.info(f"Parsing url: {item}")
        report_item, article_text = parse_website(item.url)
        logger.info(f"items found in url: {report_item}. Article text: {article_text}")

        claims = get_claims_form_text(logger, co_gen, article_text, report_item)
        logger.info(f'Claims detected: {claims}')

        if len(claims) > 0:
            claim_embeddings = get_claim_embeddings(co, claims)
            logger.info(f"Embeddings retrieved from Cohere API")

            found_claims = verify_claims(
                logger,
                search_index,
                claims_db,
                claim_embeddings,
                claims,
                top_k=5,
            )
            logger.info(f"Number of claims found in DB: {len(found_claims)}")

            if report_item:
                report_item.update({
                    'found_claims': found_claims,
                })
            else:
                report_item = {}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

    return report_item

"""
            data = {
                "authors": [
                    "November"
                ],
                "published_date": "04/11/2022",
                "found_claims": [
                    {
                        'predicted_category': 'FALSE',
                        'found': true,
                        'claim_text': 'This is claim 1',
                    },
                    {
                        'predicted_category': 'FALSE',
                        'found': true,
                        'claim_text': 'This is claim 2',
                    }
                ]
            }
"""