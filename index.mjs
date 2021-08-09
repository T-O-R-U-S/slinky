
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

// Connects mongoose to DB.
mongoose.connect(
	// Forgot to rename DB, kekw
	`mongodb+srv://slinky:${process.env.PASS}@cluster0.auiw8.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`, {useNewUrlParser: true, useUnifiedTopology: true}
);

// Schema for links.
const linkSchema = mongoose.Schema({
	link: String,
	visits: Number
});

// Mongoose model
const Link = mongoose.model(
	"link",
	linkSchema
);

import Koa from 'koa';
import Router from '@koa/router';

// Creation of server components
const app = new Koa();
const router = new Router();

// Quick and easy way to serve static files
import serve from 'koa-static'; // NOTE: named 'serve' because 'static' is forbidden in strict mode.

// Used to parse ctx.request.body
import body from 'koa-body';

// Landing page, serves "public" folder
router.get('/', serve("public"))

// Post to '/' to make a new short link
router.post('/', body(), async (ctx, next) => {
	let newLink = await new Link({
		// Take link from request body
		link: ctx.request.body.link,
		visits: 0
	});

	// Save link to database
	newLink.save();

	// Change response status
	ctx.response.status = 200;

	// Not the cleanest. I should review this later.
	// Serves response page with the shortened link ID
	ctx.response.body = `
	<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta http-equiv="X-UA-Compatible" content="IE=edge">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<title>Slinky</title>
		<style>
			body {
				margin: 0;
			}
			div {
				background-color: pink;
				display: flex;
				justify-content: center;
				align-items: center;
				height: 75vh;
				width: 100%;
				flex-direction: column;
			}
			input {
				width: 10vw;
			}
		</style>
	</head>
	<body>
		<div>
			<h1>Your shortened link ID is:</h1>
			<h2><a href="/short/${newLink._id}">${newLink._id}</a></h2>
		</div>
	</body>
	</html>
	`;
	next()
});

// Error page. If any function fails, you will be directed here.
router.get(
	"/error", 
	// Due to a quirk of koa-route, it automatically 
	// assumes that I'm in the error directory, so I serve
	// "." which gives the current working directory instead
	serve(".")
)

router.get("/visits/:id", async (ctx, next) => {
	try {
		let link = await Link.findById(ctx.params.id);
		ctx.response.body = link.visits;
		link.save();
	} catch(err) {
		console.log(err)
		ctx.response.redirect("/error")
	}
	next();
})

router.get("/short/:id", async (ctx, next) => {
	try {
		// Find user's link
		let link = await Link.findById(ctx.params.id);

		// Update visit count
		link.visits += 1;

		// Redirect user to link
		ctx.response.redirect(link.link)

		// Update link's information
		link.save();

	} catch(err) {
		console.log(err)
		
		// Redirect user to error page
		ctx.response.redirect("/error")
	}
	next()
})

app
	.use(router.routes())
	.use(router.allowedMethods());

app.listen(3000);