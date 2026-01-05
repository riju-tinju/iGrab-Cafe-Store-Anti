let resRender = (req, res, path, pathAr, data) => {
    try {
        let selectedPath
        if (res.locals.customer.language == 'en') {
            selectedPath = path;
        } else {
            selectedPath = pathAr;
        }

        return res.render(selectedPath, {
            ...data,
        })
    } catch (err) {

    }

}
module.exports = resRender;