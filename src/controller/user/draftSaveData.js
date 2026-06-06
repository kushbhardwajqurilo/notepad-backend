const Draft = require("../../model/draftsModel");

exports.addSaveDraft = async (req,res)=>{
    const { content } = req.body;

    try {
        let draft = await Draft.findOne();
        if (draft) {
            draft.content = content;
            draft.updatedAt = Date.now();
            await draft.save();
        } else {
            draft = new Draft({ content });
            await draft.save();
        }
        res.status(200).json({ message: 'Draft saved successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Error saving draft', error });
    }
}