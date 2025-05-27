import Agent from "@/components/Agent";


const Page = async () => {

    return (
        <>
            <h3>Interview generation</h3>

            <Agent
                userName="You"
                userId="user1"
                type="generate"
            />
        </>
    )
}

export default Page;

