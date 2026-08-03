import asyncio

from app.services.sportmonks_service import (
    SportmonksAPIError,
    SportmonksService,
)


async def main():
    service = SportmonksService()

    try:
        result = await service.get_team(939, False)
        print(result)
    except SportmonksAPIError as error:
        print("SportmonksAPIError:")
        print(error)


asyncio.run(main())
