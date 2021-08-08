import mongoose from 'mongoose'
import * as secret from './secrets.json'

const errorPage = `
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
		<h1>There was an error in your request</h1>
		<h3>Maybe your shortener ID is wrong, or the provided link was invalid.</h3>
	</div>
</body>
</html>
`

mongoose.connect(
	`mongodb+srv://slinky:${secret.default.pass}@cluster0.auiw8.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`, {useNewUrlParser: true, useUnifiedTopology: true}
);

const linkSchema = mongoose.Schema({
	link: String,
	visits: Number
});

const Link = mongoose.model(
	"link",
	linkSchema
);

// Server initialization
import Koa from 'koa';
import Router from '@koa/router';

// Classes
const app = new Koa();
const router = new Router();

import serve from 'koa-static';
import body from 'koa-body';

router.get('/', serve("./public"))

router.post('/', body(), async (ctx, next) => {
	let newLink = await new Link({
		link: ctx.request.body.link,
		visits: 0
	});

	newLink.save();

	ctx.response.status = 200;
	ctx.response.message = `Your link ID is ${newLink._id}`;
	next()
});

// Tried to statically serve ./error, but it was returning a "not found" for some reason. :(
router.get("/error", (ctx) => ctx.response.body = errorPage)

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
		let link = await Link.findById(ctx.params.id);
		link.visits += 1;
		ctx.response.redirect(link.link)
		link.save();
	} catch(err) {
		console.log(err)
		ctx.response.redirect("/error")
	}
	/*
	if(link != undefined)	{
		ctx.response.body = `
		<html>
			<script>
				location.replace("${link.link}")
			</script>
		</html>
		`
		link.visits++;
		link.update();
		next();
		return;
	} else {
		ctx.response.body = "Invalid link!"
	}
	*/
	next()
})

app
	.use(router.routes())
	.use(router.allowedMethods());

app.listen(3000);