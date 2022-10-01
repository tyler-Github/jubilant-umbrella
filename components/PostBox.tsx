import { useSession } from "next-auth/react";
import React, { useState } from "react";
import Avatar from "./Avatar";
import { PhotoIcon, LinkIcon } from "@heroicons/react/24/solid";
import { useForm } from "react-hook-form";
import { useMutation } from "@apollo/client";
import client from "../apollo-client";
import { ADD_POST, ADD_SUBREDDIT } from "../graphql/mutations";
import { GET_SUBREDDIT_LIST_BY_TOPIC } from "../graphql/queries";
import toast from "react-hot-toast";

type FormData = {
	postTitle: string;
	postBody: string;
	postImage: string;
	subreddit: string;
};

function PostBox() {
	{
		/* useSession so we can use logged in user state*/
	}
	const { data: session } = useSession();

	{
		/* Using the useMutation hook from Apollo Client. It is taking the ADD_POST mutation and storing it in the addPost variable. */
	}
	const [addPost] = useMutation(ADD_POST);

	{
		/* taking the ADD_SUBREDDIT mutation and storing it in the addSubreddit variable. */
	}
	const [addSubreddit] = useMutation(ADD_SUBREDDIT);

	{
		/* useState for Image */
	}
	const [imageBoxOpen, setimageBoxOpen] = useState(false);

	/* useForm so we can use form state, Destructuring the useForm hook. */
	const {
		register,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = useForm();

	{
		/* onSubmit function */
	}
	const onSubmit = handleSubmit(async (formData) => {
		console.log(formData);

		{
			/* A toast notification. It is a notification that pops up on the screen. react-hot-toast*/
		}
		const notification = toast.loading("Posting...");

		/* Checking if the subreddit exists. If it does not exist, it will alert the user. */
		try {
			/* Destructuring the data from the query. */

			const {
				data: { getSUBREDDITListByTopic },
			} = await client.query({
				// Query for the subreddit topic; check if the subreddit with the topic exists
				query: GET_SUBREDDIT_LIST_BY_TOPIC,
				variables: {
					topic: formData.subreddit,
				},
			});

			const subredditExists = getSUBREDDITListByTopic.length > 0; // Check if the subreddit exists

			/* Checking if the subreddit exists. If it does not exist, it will create a new subreddit with that topic */
			if (!subredditExists) {
				console.log(
					"Subreddit does not exist, Creating a new subreddit"
				);

				/* Adding a new subreddit to the database. */
				const {
					data: { insertSUBREDDIT: newSubreddit },
				} = await addSubreddit({
					variables: {
						topic: formData.subreddit,
					},
				});

				console.log(
					"Subreddit created. Creating a new post...",
					formData
				);

				const image = formData.postImage || " "; // If there is no image, set it to an empty string, protecting the database from null values.

				{
					/* Adding a new post to the database. it will have the subreddit id of the newSubreddit.
					Destructuring the data from the addPost mutation. 
				*/
				}

				/* Adding a new post to the database. */
				const {
					data: { insertPOST: newPost },
				} = await addPost({
					variables: {
						title: formData.postTitle,
						body: formData.postBody,
						image: image,
						subreddit_id: newSubreddit.id,
						username: session?.user?.name,
					},
				});

				console.log("New Post created: ", newPost);
			} else {
				// If the subreddit exists, it will add the post to the database under that subreddit.

				console.log(
					"Subreddit exists. Using existing subreddit to create a new post...",
					formData
				);
				console.log(getSUBREDDITListByTopic);

				const image = formData.postImage || " "; // If there is no image, set it to an empty string, protecting the database from null values.

				/* Destructuring the data from the addPost mutation. */
				/* Adding a new post to the database. */
				const {
					data: { insertPOST: newPost },
				} = await addPost({
					variables: {
						title: formData.postTitle,
						body: formData.postBody,
						image: image,
						subreddit_id: getSUBREDDITListByTopic[0].id,
						username: session?.user?.name,
					},
				});

				console.log("New Post created: ", newPost);
			}

			{
				/* After the post has been added to the db */
			}
			setValue("postTitle", ""); // Clear the post title
			setValue("postBody", ""); // Clear the post body
			setValue("postImage", ""); // Clear the post image
			setValue("subreddit", ""); // Clear the subreddit

			/* A toast notification when post is created successfully. react-hot-toast */
			toast.success("New Post Created!", {
				id: notification,
			});

			toast.custom(
				(t) => (
					<div
						className={`${
							t.visible ? "animate-enter" : "animate-leave"
						} 
						max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5 mx-5`}
					>
						<div className='flex-1 w-0 p-4'>
							<div className='flex items-start'>
								<div className='flex-shrink-0 pt-0.5'>
									<Avatar></Avatar>
								</div>
								<div className='ml-3 flex-1'>
									<p className='text-sm font-medium text-gray-900'>
										{session?.user?.name}
									</p>
									<p className='mt-1 text-sm text-gray-500'>
										{formData.postTitle}
									</p>
								</div>
							</div>
						</div>
						<div className='flex border-l border-gray-200'>
							<button
								onClick={() => toast.dismiss(t.id)}
								className='w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500'
							>
								Close
							</button>
						</div>
					</div>
				),
				{
					position: "bottom-right",
				}
			);

			{
				/* Catching any errors */
			}
		} catch (error) {
			toast.error("Error creating post", {
				id: notification,
			});
			console.log(error);
		}
	});

	return (
		<form
			/* Calling the onSubmit function. */
			onSubmit={onSubmit}
			className='sticky top-16 z-50 bg-white border rounded-md border-gray-300 p-2 '
		>
			<div className='flex items-center space-x-3 '>
				{/* User Avatar */}
				<Avatar />

				{/* Checking if the user is signed in. If they are, it will display "Create a Post" in the input box. 
                If they are not signed in, it will display "Sign In to create a post" in the input box. 
                And the input box will be disabled.
            */}
				<input
					/* A spread operator. It is taking the register function and spreading it out. */
					{...register("postTitle", { required: true })}
					disabled={!session}
					className='flex-1 bg-gray-50 p-2 pl-5 outline-none rounded-md '
					type='text'
					placeholder={
						session ? "Create a Post" : "Sign In to create a post"
					}
				/>

				<PhotoIcon
					onClick={() => setimageBoxOpen(!imageBoxOpen)}
					className={`h-6 text-gray-300 cursor-pointer ${
						imageBoxOpen && "text-blue-500"
					}`}
				/>

				<LinkIcon className='h-6 text-gray-300' />
			</div>

			{/* Checking if the user has typed anything in the input box. If they have, it will display this section.
				If they have not, it will not display. */}
			{!!watch("postTitle") && (
				<div className='flex flex-col py-2 '>
					{/* Post Body */}
					<div className='flex items-center px-2'>
						<p className='min-w-[90px]'>Body:</p>
						<input
							className='flex-1 m-2 bg-gray-50 p-2 outline-none'
							{...register("postBody")}
							type='text'
							placeholder='Text (optional)'
						/>
					</div>

					{/* Sub-Reddit */}
					<div className='flex items-center px-2'>
						<p className='min-w-[90px]'>Subreddit:</p>
						<input
							className='flex-1 m-2 bg-gray-50 p-2 outline-none'
							{...register("subreddit", { required: true })}
							type='text'
							placeholder='i.e. Next.js'
						/>
					</div>

					{/* Image */}
					{/* Checking if the imageBoxOpen state is true. If it is, it will display the div. 
						If it is not, it will not display the div. 
					*/}
					{imageBoxOpen && (
						<div className='flex items-center px-2'>
							<p className='min-w-[90px]'>Image URL:</p>
							<input
								className='flex-1 m-2 bg-gray-50 p-2 outline-none'
								{...register("postImage")}
								type='text'
								placeholder='Optional'
							/>
						</div>
					)}

					{/* Erros */}
					{/* Checking if there are any errors. If there are, it will display the relevant div. 
						If there are not, it will not display the div. 
					*/}
					{Object.keys(errors).length > 0 && (
						<div className='space-y-2 p-2 text-red-500'>
							{errors.postTitle?.type === "required" && (
								<p className=' text-xs'>
									❗A Title for the post is required.
								</p>
							)}

							{errors.subreddit?.type === "required" && (
								<p className='text-xs'>
									❗A Subreddit for the post is required.
								</p>
							)}
						</div>
					)}

					{/* Post Button */}
					{/* Checking if the user has typed anything in the Post Title input box. 
						If they have, it will display the submit post button. 
						If they have not, it will not display the button. 
					*/}
					{!!watch("postTitle") && (
						<button
							type='submit'
							className='w-full rounded-full bg-blue-400 text-white '
						>
							Post
						</button>
					)}
				</div>
			)}
		</form>
	);
}

export default PostBox;
