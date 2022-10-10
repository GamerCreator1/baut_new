Here's what you need to do when making a contribution to Builderbaut:

-   Clone the repo locally, and install libraries with `yarn`.
-   Check the `.env.example` to make your own `.env`, DM me on Discord @ CheesyNeesh#5076 if you have any questions
-   You will need an Discord Token to create a bot, more information here: https://discord.com/developers/docs/getting-started
-   Fill out all the .env with the content needed

## Set up Database:

-   Builderbaut use [postgresql](https://www.postgresql.org/) and [Prisma](https://www.prisma.io/)
-   After setting up the database [Don't know how to?](https://www.prisma.io/dataguide/postgresql/setting-up-a-local-postgresql-database)
-   Use `npx prisma db push` to connect your prisma with the database and setup the tables

## Running the bot

-   If you go into any trouble with the `.env` file, you might will see an error showing what value is false
-   Run `yarn dev` to start the development mode of the bot

## Additional Notes

-   Check the issues for anything you might be able to do, or think of a new feature that might be useful and code it out!
-   Make a fork and push all your changes to it, and make a pull request with a descriptive title and explanation of what you added.

Not sure how to make a fork and push?
Here are some resources to help you out:
https://docs.github.com/en/get-started/quickstart/contributing-to-projects

Happy Hacking!
